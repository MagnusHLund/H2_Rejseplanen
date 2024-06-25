const originInput = document.getElementById('from')
const destinationInput = document.getElementById('to')
const date = document.getElementById('date')

function displayJourney(journey) {
  let vehicleOverview = []

  journey.forEach((vehicle) => {
    vehicleOverview = [...vehicleOverview, formatJourney(vehicle)]
  })

  const parent = document.getElementById('journeys')
  const journeyDiv = $(`<div class='journey'>`)
  let g = []
  vehicleOverview.forEach((vehicle) => {
    g = [
      ...g,
      `<div class='vehicle'><div class='top'><p>${vehicle.origin.time}</p><p>${
        vehicle.origin.name
      }</p><p>${vehicle.origin.track}</p></div class="type ${
        vehicle.type
      }"><div><h4>${'time'}</h4></div><div class='bottom'><p>${
        vehicle.destination.time
      }</p><p>${vehicle.destination.name}</p><p>${
        vehicle.destination.track
      }</p></div></>`,
    ]
  })

  $(parent).append(journeyDiv)
  g.forEach((element) => {
    console.log(element)
    $(journeyDiv).append(element)
  })
}

async function newSearch() {
  const origin = originInput.value
  const destination = destinationInput.value
  const departure = date.value

  if (origin == '' || destination == '' || departure == '') {
    return
  }

  const originDetails = await getLocationDetails(origin)
  const destinationDetails = await getLocationDetails(destination)

  const fetchedDetails = await fetch(
    `https://xmlopen.rejseplanen.dk/bin/rest.exe/trip?originId=${originDetails.id}&destCoordX=${destinationDetails.x}&destCoordY=${destinationDetails.y}&destCoordName=${destinationDetails.name}&date=24.06.24&time=07:02&format=json`
  )

  const fetchedDetailsJson = await fetchedDetails.json()

  const formattedJourneys = fetchedDetailsJson.TripList.Trip

  formattedJourneys.forEach((journey) => {
    displayJourney(journey.Leg)
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
    destination: { name: '', time: '', track: '' },
  }

  formattedJourney.type = vehicle.type

  formattedJourney.origin.name = vehicle.Origin.name
  formattedJourney.origin.time = vehicle.Origin.time
  formattedJourney.origin.track = vehicle.Origin.track

  formattedJourney.destination.name = vehicle.Destination.name
  formattedJourney.destination.time = vehicle.Destination.time
  formattedJourney.destination.track = vehicle.Destination.track

  return formattedJourney
}
