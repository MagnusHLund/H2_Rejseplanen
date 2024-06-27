const originInput = document.getElementById('origin-input')
const destinationInput = document.getElementById('destination-input')
const date = document.getElementById('date-input')

const journeyContainer = document.getElementById('journey__container')

let apiCooldown

function displayDepartureBoard(departure) {
  const departureDiv = $('<div class="departures">')

  const departureDetails = `<div class="departure"><div class="type ${departure.type.toLowerCase()}"></div><div class="departure__info"><p class="departure__name">${
    departure.name
  }</p><p>${departure.track ? `spor ${departure.track}` : ' '}</p><p>${
    departure.time
  }</p></div></div>`

  $(journeyContainer).append(departureDiv)
  $(departureDiv).append(departureDetails)
}

async function displayJourney(journey) {
  const transportOverview = journey.map(formatJourney)

  const journeyDiv = $('<div class="journey">')

  $(journeyContainer).append(journeyDiv)
  const formattedTransports = transportOverview.map((transport) => {
    const travelTime = calculateTransportTime(
      transport.origin.time,
      transport.destination.time
    )

    if (!travelTime) {
      return ''
    }

    return `
    <div class="transport">
      <div class="top">
        <p>${transport.origin.time}</p>
        <p class="transport__origin--name">${transport.origin.name}</p>
        <p>${
          transport.origin.track ? `spor ${transport.origin.track}` : ' '
        }</p>
      </div>
      <div class='type-container'>
        <div class="type ${transport.type.toLowerCase()}"></div>
        <h4>${transport.type}</h4>
        <h4>${travelTime}</h4>
      </div>
      <div class="bottom">
        <p>${transport.destination.time}</p>
        <p class="transport__destination--name">${
          transport.destination.name
        }</p>
        <p>${
          transport.destination.track
            ? `spor ${transport.destination.track}`
            : ' '
        }</p>
      </div>
    </div>
  `
  })

  formattedTransports.forEach((transport) => {
    console.log(transport)
    $(journeyDiv).append(transport)
  })
}

async function newDepartureBoardSearch() {
  removePreviousSearch()
  const origin = originInput.value
  const departureTime = date.value

  if (!isValidInput([origin, departureTime])) {
    displayError()
    return
  }

  const originDetails = await getLocationDetails(origin)

  const timeObject = formatTime(departureTime)
  const formattedDate = `${timeObject.day}.${timeObject.month}.${timeObject.year}`
  const formattedTime = `${timeObject.hour}:${timeObject.minute}`

  const fetchedDetailsJson = await callApi(
    `https://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${originDetails.id}&date=${formattedDate}&time=${formattedTime}&format=json`
  )

  const formattedDepartures = fetchedDetailsJson.DepartureBoard.Departure

  try {
    formattedDepartures.forEach((departure) => {
      displayDepartureBoard(departure)
    })
  } catch (error) {
    displayError()
  }
}

async function newTripSearch() {
  removePreviousSearch()

  const origin = originInput.value
  const destination = destinationInput.value
  const departureTime = date.value

  if (!isValidInput([origin, destination, departureTime])) {
    displayError()
    return
  }

  const originDetails = await getLocationDetails(origin)
  const destinationDetails = await getLocationDetails(destination)

  const timeObject = formatTime(departureTime)
  const formattedDate = `${timeObject.day}.${timeObject.month}.${timeObject.year}`
  const formattedTime = `${timeObject.hour}:${timeObject.minute}`

  const fetchedDetailsJson = await callApi(
    `https://xmlopen.rejseplanen.dk/bin/rest.exe/trip?originId=${originDetails.id}&destCoordX=${destinationDetails.x}&destCoordY=${destinationDetails.y}&destCoordName=${destinationDetails.name}&date=${formattedDate}&time=${formattedTime}&format=json`
  )

  const formattedJourneys = fetchedDetailsJson.TripList.Trip

  try {
    formattedJourneys.forEach((journey) => {
      displayJourney(journey.Leg)
    })
  } catch (error) {
    displayError()
  }
}

async function getLocationDetails(searchInput) {
  const fetchedDetailsJson = await callApi(
    `https://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=${searchInput}&format=json`
  )

  const firstLocation = fetchedDetailsJson.LocationList.StopLocation[0]

  return {
    name: firstLocation.name,
    id: firstLocation.id,
    x: firstLocation.x,
    y: firstLocation.y,
  }
}

function formatJourney(transport) {
  return {
    type: transport.type,
    origin: {
      name: transport.Origin.name,
      time: transport.Origin.time,
      track: transport.Origin.track ?? '',
    },
    destination: {
      name: transport.Destination.name,
      time: transport.Destination.time,
      track: transport.Destination.track ?? '',
    },
  }
}

function isValidInput(inputs) {
  return inputs.every((input) => input !== '')
}

function formatTime(dateInput) {
  const [datePart, timePart] = dateInput.split('T')
  const [year, month, day] = datePart.split('-')
  const [hours, minutes] = timePart.split(':')

  const timeObject = {
    year,
    month,
    day,
    hour: hours,
    minute: minutes,
  }

  return timeObject
}

function removePreviousSearch() {
  $('#journey__container').empty()
}

function calculateTransportTime(originTime, destinationTime) {
  const [originHours, originMinutes] = originTime.split(':').map(Number)
  const [destHours, destMinutes] = destinationTime.split(':').map(Number)

  const originMinutesTotal = originHours * 60 + originMinutes
  const destMinutesTotal = destHours * 60 + destMinutes
  const travelMinutes = Math.abs(destMinutesTotal - originMinutesTotal)

  if (travelMinutes <= 1) {
    return null
  } else if (travelMinutes < 60) {
    return `${travelMinutes} minutes`
  } else {
    const travelHours = Math.floor(travelMinutes / 60)
    const leftoverMinutes = travelMinutes % 60
    return `${travelHours} hour${
      travelHours > 1 ? 's' : ''
    } and ${leftoverMinutes} minutes`
  }
}

async function suggestLocations(event) {
  removeSuggestions()
  const value = event.target.value

  clearTimeout(apiCooldown)
  apiCooldown = setTimeout(async () => {
    const response = await callApi(
      `https://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=${value}&format=json`
    )

    let formattedResponse = response.LocationList.StopLocation

    // This is required because writing "sl" in an input field, returns only 1 location. This is not within an array.
    if (!Array.isArray(formattedResponse)) {
      formattedResponse = new Array(formattedResponse)
    }

    const itemsToDisplayLimit = 5

    const inputId = event.target.id
    let suggestionsContainer = ''

    switch (inputId) {
      case originInput.id:
        suggestionsContainer = document.getElementById(
          'origin--suggestions__container'
        )
        break
      case destinationInput.id:
        suggestionsContainer = document.getElementById(
          'destination--suggestions__container'
        )
        break
    }

    for (let i = 0; i < itemsToDisplayLimit; i++) {
      const suggestion = formattedResponse[i].name
      const suggestedItem = document.createElement('li')
      suggestedItem.classList.add('suggestion')
      suggestedItem.textContent = suggestion

      suggestedItem.addEventListener('mousedown', () => {
        event.target.value = suggestion
        removeSuggestions()
      })

      suggestionsContainer.appendChild(suggestedItem)
    }
  }, 300)
}

async function callApi(url) {
  return await fetch(url)
    .then((response) => response.json())
    .catch(() => displayError())
}

function removeSuggestions() {
  $('#origin--suggestions__container').empty()
  $('#destination--suggestions__container').empty()
}

function displayError() {
  $(journeyContainer).append(
    '<p data-i18n="error">Woops! Der opstod en fejl</p>'
  )
}

function updateContent(language) {
  const selector = 'data-i18n'
  document.querySelectorAll(`[${selector}]`).forEach((element) => {
    const key = element.getAttribute(selector)
    element.textContent = language[key]
  })
}

async function updateLanguage(language) {
  const languageMap = {
    da: './translations/da.json',
    en: './translations/en.json',
    de: './translations/de.json',
  }

  const filePath = languageMap[language]

  fetch(filePath)
    .then((response) => response.json())
    .then((langData) => updateContent(langData))
    .catch((error) => console.error('Error: ' + error))
}
