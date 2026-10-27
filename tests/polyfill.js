import {TextEncoder, TextDecoder} from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

if (!Symbol.dispose) Symbol.dispose = Symbol('Symbol.dispose')
