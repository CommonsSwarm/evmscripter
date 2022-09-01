import { Contract, utils } from 'ethers';

import { Interpreter } from '../../../interpreter/Interpreter';
import type { HelperFunction } from '../../../types';
import { ComparisonType, checkArgsLength } from '../../../utils';
import type { Std } from '../Std';

export const get: HelperFunction<Std> = async (
  module,
  h,
  { interpretNode, interpretNodes },
) => {
  checkArgsLength(h, { type: ComparisonType.Equal, minValue: 2 });

  const addressNode = h.args.shift()!;
  const abiNode = h.args.shift()!;
  const [address, abi, ...params] = await Promise.all([
    interpretNode(addressNode),
    interpretNode(abiNode, { treatAsLiteral: true }),
    interpretNodes(h.args),
  ]);

  if (!utils.isAddress(address)) {
    Interpreter.panic(
      h,
      `expected a valid target address, but got "${address}"`,
    );
  }

  const [body, returns] = abi.split(':');
  const contract = new Contract(
    address,
    [`function ${body} external view returns ${returns}`],
    module.signer,
  );

  return contract[body](...params);
};