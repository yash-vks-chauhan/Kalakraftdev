import { EventEmitter } from 'events'

export const orderEvents = new EventEmitter()
// Optionally bump listener limit if you expect many clients:
orderEvents.setMaxListeners(100)