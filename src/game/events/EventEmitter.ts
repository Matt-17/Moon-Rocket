//  A convenient dependency that allows us to emit events throughout our applications.
//  This makes reactions to events more flexible and easier to manage.
//
//  Shoutout to "Kal_Torak" for this solution!
import { EventEmitter } from 'eventemitter3'
const eventEmitter = new EventEmitter()
export default eventEmitter
