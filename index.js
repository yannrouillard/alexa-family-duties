'use strict'

const moment = require('moment-timezone')


const TIMEZONE = 'Australia/Sydney'

const FAMILY_MEMBERS = ['Elea', 'Nathan', 'Raphael', 'Malia', 'Yann']

const TABLE_DUTY_ASSIGNMENT = ['Daddy or mummy', 'Elea', 'Nathan', 'Raphael', 'Elea', 'Nathan', 'Daddy or mummy']


/* *******************************************************************************
 * Alexa helpers functions
 * ******************************************************************************/

function buildResponse(responseParameters) {
  const response = { version: '1.0', response: { shouldEndSession: true } }

  if (responseParameters.speechText) {
    response.response.outputSpeech = { type: 'SSML', ssml: `<speak>${responseParameters.speechText}</speak>` }
  }

  if (responseParameters.playUrl) {
    response.response.directives = [{
      type: 'AudioPlayer.Play',
      playBehavior: 'REPLACE_ENQUEUED',
      audioItem: {
        stream: { token: responseParameters.playUrl, url: responseParameters.playUrl, offsetInMilliseconds: 0 },
      },
    }]
  }
  return response
}

/* *******************************************************************************
 * Main code
 * ******************************************************************************/

const handlers = {

  SetTable(event, emitResponse) {
    const dayOfWeek = moment().tz(TIMEZONE).day()

    const chosenOne = TABLE_DUTY_ASSIGNMENT[dayOfWeek]
    let speechText = `it is ${chosenOne} who should set the table today!`

    const nextChosenOne = TABLE_DUTY_ASSIGNMENT[(dayOfWeek + 1) % TABLE_DUTY_ASSIGNMENT.length]
    speechText += `Be ready ${nextChosenOne}, it will be your turn tomorrow!`
    emitResponse({ speechText })
  },

  PickSomeone(event, emitResponse) {
    const randomIndex = Math.floor(Math.random() * FAMILY_MEMBERS.length)
    const chosenOne = FAMILY_MEMBERS[randomIndex]
    const speechText = `the lucky winner is ${chosenOne}`
    emitResponse({ speechText })
  },

  MummyInstead(event, emitResponse) {
    const speechText = `
    Aren't you ashamed?! Mummy is already doing pretty much everything in the house!
    You should be thankful to her and try your best to help her everyday.
    `
    emitResponse({ speechText })
  },
}


exports.handler = function (event, context) {
  console.log(`Received skill request of type ${event.request.type}`)

  function emitResponse(responseParameters) { context.succeed(buildResponse(responseParameters)) }
  function raiseException(exception) { context.fail(`Exception: ${exception}`) }

  let handlerName = 'default'
  if (event.request.type === 'IntentRequest') {
    handlerName = `Intent${event.request.intent.name}`
  } else if (event.request.type.startsWith('AudioPlayer.')) {
    handlerName = event.request.type.replace('.', '')
  } else if (event.request.type === 'System.ExceptionEncountered') {
    handlerName = 'errorHandler'
  }

  if (!(handlerName in handlers)) handlerName = 'default'

  try {
    console.log(`Executing handler ${handlerName}`)
    handlers[handlerName](event, emitResponse, raiseException)
  } catch (exception) {
    raiseException(exception)
  }
}
