const originInput = document.getElementById('from')
const destinationInput = document.getElementById('to')

function displayJourney(journey) {
  let vehicleOverview = []

  journey.forEach((vehicle) => {
    vehicleOverview = [...vehicleOverview, formatJourney(vehicle)]
  })

  const parent = document.getElementById('journeys')
  const journeyDiv = `<div><p>xx:xx</p><div></div><p>xx:xx</p></div>`

  $(parent).append(journeyDiv)
}

async function newSearch() {
  const origin = originInput.value
  const destination = destinationInput.value

  const originDetails = await getLocationDetails(origin)
  const destinationDetails = await getLocationDetails(destination)

  const fetchedDetails = await fetch(
    `https://xmlopen.rejseplanen.dk/bin/rest.exe/trip?originId=${originDetails.id}&destCoordX=${destinationDetails.x}&destCoordY=${destinationDetails.y}&destCoordName=${destinationDetails.name}&date=24.06.24&time=07:02&format=json`
  )

  const fetchedDetailsJson = await fetchedDetails.json()

  const formattedJourneys = fetchedDetailsJson.TripList.Trip

  console.log(fetchedDetailsJson)

  formattedJourneys.forEach((journey) => {
    displayJourney(journey)
  })
}

async function getLocationDetails(searchInput) {
  const fetchedDetails = await fetch(
    `https://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=${searchInput}&format=json`
  )

  const fetchedDetailsJson = await fetchedDetails.json()

  let locationDetails = { name: '', id: 0, x: 0, y: 0 }
  const firstLocation = fetchedDetailsJson.LocationList.StopLocation[0]

  locationDetails.name = firstLocation.name
  locationDetails.id = firstLocation.id
  locationDetails.x = firstLocation.x
  locationDetails.y = firstLocation.y

  return locationDetails
}

function formatJourney(vehicle) {
  let formattedJourney = {
    type: '',
    origin: { name: '', time: '', track: '' },
    departure: { name: '', time: '', track: '' },
  }

  formattedJourney.type = vehicle.type

  formattedJourney.origin.name = vehicle.Origin.name
  formattedJourney.origin.time = vehicle.Origin.time
  formattedJourney.origin.track = vehicle.Origin.track

  formattedJourney.departure.name = vehicle.departure.name
  formattedJourney.departure.time = vehicle.departure.time
  formattedJourney.departure.track = vehicle.departure.track

  return formattedJourney
}
