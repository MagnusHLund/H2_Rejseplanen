const div = document.getElementsByClassName('footer')

const links = [
  {
    title: 'Hjælp',
    link: 'https://help.rejseplanen.dk/hc/en-us/categories/201611989',
  },
  {
    title: 'Om',
    link: 'https://help.rejseplanen.dk/hc/en-us/categories/201733769',
  },
  {
    title: 'Labs',
    link: 'https://help.rejseplanen.dk/hc/en-us/categories/201728005',
  },
  {
    title: 'Erhverv',
    link: 'https://help.rejseplanen.dk/hc/en-us/sections/203204785',
  },
  {
    title: 'Privatliv & cookies',
    link: 'https://help.rejseplanen.dk/hc/en-us/articles/214318725-Privacy-and-cookie-policy',
  },
  {
    title: 'tilgængelighedserklæring',
    link: 'https://www.was.digst.dk/rejseplanen-dk',
  },
]

links.forEach((link) => {
  const element = `<a href=${link.link} target='blank' class='footer__link'>${link.title}<a>`

  $(div).append(element)
})
