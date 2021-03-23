import { NowRequest, NowResponse } from '@vercel/node'
import axios from 'axios'

const slack = axios.create({
  baseURL: 'https://slack.com/api',
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
  },
})

type Payload =
  | {
      type: 'unknown'
    }
  | {
      type: 'url_verification'
      challenge: string
    }
  | {
      type: 'event_callback'
      event:
        | {
            type: 'emoji_changed'
            subtype: 'add'
            name: string
            value: string
            event_ts: string
          }
        | {
            type: 'emoji_changed'
            subtype: 'remove'
            names: string[]
            event_ts: string
          }
        | {
            type: 'emoji_changed'
            subtype: 'rename'
            old_name: string
            new_name: string
            value: string
            event_ts: string
          }
    }

export default async (request: NowRequest, response: NowResponse) => {
  try {
    const payload: Payload = request.body

    switch (payload.type) {
      case 'url_verification':
        response.status(200).send(payload.challenge)
        return

      case 'event_callback':
        if (
          payload.event.type === 'emoji_changed' &&
          payload.event.subtype === 'add'
        ) {
          const text = `新しい絵文字 :${payload.event.name}: (${payload.event.name}) が追加されました :tada:`
          const response = await slack.post('/chat.postMessage', {
            channel: process.env.SLACK_CHANNEL,
            text,
          })
          console.log(response)
        }
        break

      default:
        console.warn(payload)
    }
  } catch (e) {
    console.error(request.body)
    console.error(e)
  }
  response.status(200).send({})
}
