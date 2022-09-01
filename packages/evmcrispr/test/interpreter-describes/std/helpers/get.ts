import { expect } from 'chai';
import type { Signer } from 'ethers';
import { ethers } from 'hardhat';

import { NodeType } from '../../../../src/cas11/types';
import { ComparisonType } from '../../../../src/cas11/utils';

import {
  itChecksInvalidArgsLength,
  runExpression,
} from '../../../test-helpers/cas11';

export const getDescribe = (): Mocha.Suite =>
  describe('@get(contractAddress, method)', () => {
    let signer: Signer;
    const lazySigner = () => signer;

    before(async () => {
      [signer] = await ethers.getSigners();
    });

    it('should interpret it correctly', async () => {
      const name = await runExpression(
        '@get(0xdf032bc4b9dc2782bb09352007d4c57b75160b15, name():(string))',
        signer,
      );

      expect(name).to.eq('Wrapped Ether');
    });

    itChecksInvalidArgsLength(
      NodeType.HelperFunctionExpression,
      '@get',
      ['0xdf032bc4b9dc2782bb09352007d4c57b75160b15', 'name():(string)'],
      {
        type: ComparisonType.Equal,
        minValue: 2,
      },
      lazySigner,
    );
  });