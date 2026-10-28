/** One-tap navigation from the address text. No map library or API key needed. */
export function googleMapsLink(address: string) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
}

export function wazeLink(address: string) {
  return "https://waze.com/ul?q=" + encodeURIComponent(address) + "&navigate=yes";
}
