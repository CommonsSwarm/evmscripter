import type { Commands } from '../../../types';
import type { Giveth } from '../Giveth';

import { donate } from './donate';
import { finalizeGivbacks } from './finalize-givbacks';
import { initiateGivbacks } from './initiate-givbacks';

export const commands: Commands<Giveth> = {
  donate,
  'finalize-givbacks': finalizeGivbacks,
  'initiate-givbacks': initiateGivbacks,
};
