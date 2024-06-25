const originInput = document.getElementById('from-input')
const destinationInput = document.getElementById('to-input')
const date = document.getElementById('date-input')

async function displayJourney(journey) {
  const transportOverview = journey.map(formatJourney)

  const parent = document.getElementById('journeys')
  const journeyDiv = $('<div class="journey">')
  $(parent).append(journeyDiv)
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
        <p>${transport.origin.name}</p>
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
        <p>${transport.destination.name}</p>
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

async function newSearch() {
  removePreviousSearch()

  const origin = originInput.value
  const destination = destinationInput.value
  const departure = date.value

  if (!isValidInput([origin, destination, departure])) {
    return
  }

  const originDetails = await getLocationDetails(origin)
  const destinationDetails = await getLocationDetails(destination)

  const timeObject = formatTime(departure)
  const formattedDate = `${timeObject.day}.${timeObject.month}.${timeObject.year}`
  const formattedTime = `${timeObject.hour}:${timeObject.minute}`

  const fetchedDetailsJson = await callApi(
    `https://xmlopen.rejseplanen.dk/bin/rest.exe/trip?originId=${originDetails.id}&destCoordX=${destinationDetails.x}&destCoordY=${destinationDetails.y}&destCoordName=${destinationDetails.name}&date=${formattedDate}&time=${formattedTime}&format=json`
  )

  const formattedJourneys = fetchedDetailsJson.TripList.Trip

  formattedJourneys.forEach((journey) => {
    displayJourney(journey.Leg)
  })
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
  $('#journeys').empty()
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

  const response = await callApi(
    `https://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=${value}&format=json`
  )

  const formattedResponse = response.LocationList.StopLocation

  const itemsToDisplayLimit = 5

  const inputId = event.target.id
  let suggestionsContainer = ''

  switch (inputId) {
    case 'from-input':
      suggestionsContainer = document.getElementById('from-suggestions')
      break
    case 'to-input':
      suggestionsContainer = document.getElementById('to-suggestions')
      break
  }

  for (let i = 0; i < itemsToDisplayLimit; i++) {
    const suggestion = formattedResponse[i].name
    const suggestedItem = document.createElement('li')
    suggestedItem.classList.add('suggestion')
    suggestedItem.textContent = suggestion

    suggestedItem.addEventListener('click', () => {
      event.target.value = suggestion
      removeSuggestions()
    })

    suggestionsContainer.appendChild(suggestedItem)
  }
}

async function callApi(url) {
  const response = await fetch(url)
  return await response.json()
}

function removeSuggestions() {
  $('#to-suggestions').empty()
  $('#from-suggestions').empty()
}
