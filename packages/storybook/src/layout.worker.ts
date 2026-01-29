import { expose } from 'comlink';
import { LayoutWorkerCore } from '@graphon/core';

expose(new LayoutWorkerCore());
