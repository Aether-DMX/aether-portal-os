// Dynamic backend URL - works from any device
export const getBackendUrl = () => `http://${window.location.hostname}:3000`;
export const getWsUrl = () => `ws://${window.location.hostname}:3000`;
