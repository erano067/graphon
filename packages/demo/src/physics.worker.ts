/**
 * Physics simulation web worker for the demo app.
 * Re-exports the core physics worker implementation.
 */
import { expose } from 'comlink';
import { PhysicsWorkerCore } from '@graphon/core';

expose(new PhysicsWorkerCore());
