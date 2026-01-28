/**
 * Physics simulation web worker entry point.
 *
 * Exposes PhysicsWorkerCore via Comlink for RPC-style communication.
 */

import * as Comlink from 'comlink';
import { PhysicsWorkerCore } from './PhysicsWorkerCore';

Comlink.expose(new PhysicsWorkerCore());
