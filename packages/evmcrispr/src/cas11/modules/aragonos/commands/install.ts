import { utils } from 'ethers';

import {
  buildAppArtifact,
  buildAppPermissions,
  fetchAppArtifact,
  parseLabeledAppIdentifier,
} from '../../../../utils';
import { BindingsSpace } from '../../../interpreter/BindingsManager';
import { Interpreter } from '../../../interpreter/Interpreter';
import type { CommandFunction } from '../../../types';
import {
  ComparisonType,
  checkArgsLength,
  checkOpts,
  encodeCalldata,
  getOptValue,
} from '../../../utils';
import type { AragonOS } from '../AragonOS';
import { _aragonEns } from '../helpers/aragonEns';
import { SEMANTIC_VERSION_REGEX, getRepoContract } from '../utils';

export const install: CommandFunction<AragonOS> = async (
  module,
  c,
  { interpretNode, interpretNodes },
) => {
  checkArgsLength(c, {
    type: ComparisonType.Greater,
    minValue: 1,
  });
  checkOpts(c, ['version']);

  const currentDAO = module.currentDAO;

  if (!currentDAO) {
    Interpreter.panic(c, `must be used within a "connect" command`);
  }

  const [identifierNode, ...paramNodes] = c.args;
  const identifier = await interpretNode(identifierNode, {
    treatAsLiteral: true,
  });
  let appName: string, registry: string;

  try {
    [appName, registry] = parseLabeledAppIdentifier(identifier);
  } catch (err) {
    const err_ = err as Error;
    Interpreter.panic(c, err_.message);
  }

  const repoENSName = `${appName}.${registry}`;
  const repoAddr = await _aragonEns(repoENSName, module);

  if (!repoAddr) {
    Interpreter.panic(c, `ENS repo name ${repoENSName} couldn't be resolved`);
  }

  const repo = getRepoContract(repoAddr, module.signer);

  const version = await getOptValue(c, 'version', interpretNode);
  let codeAddress, rawContentUri;

  if (version) {
    if (!SEMANTIC_VERSION_REGEX.test(version)) {
      Interpreter.panic(
        c,
        `invalid --version option. Expected a semantic version, but got ${version}`,
      );
    }

    [, codeAddress, rawContentUri] = await repo.getBySemanticVersion(
      version.split('.'),
    );
  } else {
    [, codeAddress, rawContentUri] = await repo.getLatest();
  }

  const contentUri = utils.toUtf8String(rawContentUri);
  // Fallback to IPFS to retrieve app's data
  if (!currentDAO.appArtifactCache.has(codeAddress)) {
    const artifact = await fetchAppArtifact(module.ipfsResolver, contentUri);
    currentDAO.appArtifactCache.set(codeAddress, buildAppArtifact(artifact));
  }

  const { abiInterface, roles } = currentDAO.appArtifactCache.get(codeAddress)!;
  const kernel = currentDAO.kernel;
  const initParams = await interpretNodes(paramNodes);

  let encodedInitializeFunction: string;

  try {
    encodedInitializeFunction = encodeCalldata(
      abiInterface,
      'initialize',
      initParams,
    );
  } catch (err: any) {
    const err_ = err as Error;

    Interpreter.panic(c, err_.message);
  }

  const appId = utils.namehash(`${appName}.${registry}`);
  if (!module.bindingsManager.getBinding(identifier, BindingsSpace.ADDR)) {
    await module.registerNextProxyAddress(identifier, kernel.address);
  }
  const proxyContractAddress = module.bindingsManager.getBinding(
    identifier,
    BindingsSpace.ADDR,
  );

  if (currentDAO.appCache.has(identifier)) {
    Interpreter.panic(c, `identifier ${identifier} is already in use.`);
  }

  currentDAO.appCache.set(identifier, {
    abiInterface: abiInterface,
    address: proxyContractAddress,
    codeAddress,
    contentUri,
    name: appName,
    permissions: buildAppPermissions(roles, []),
    registryName: registry,
  });

  return [
    {
      to: kernel.address,
      data: kernel.abiInterface.encodeFunctionData(
        'newAppInstance(bytes32,address,bytes,bool)',
        [appId, codeAddress, encodedInitializeFunction, false],
      ),
    },
  ];
};