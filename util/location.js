const axios = require('axios');
const HttpError = require('../models/http-error');

const getCoordsForAddress = async address => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new HttpError('Google API key is not configured.', 500);
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.GOOGLE_API_KEY}`
    );

    const data = response.data;

    if (!data) {
      throw new HttpError('No response from geocoding service.', 500);
    }

    if (data.status === 'ZERO_RESULTS') {
      throw new HttpError('Could not find location for the specified address.', 422);
    }

    if (data.status !== 'OK') {
      const errorMsg = `Geocoding API error: ${data.status}${data.error_message ? ' - ' + data.error_message : ''}`;
      throw new HttpError(errorMsg, 500);
    }

    if (!data.results || data.results.length === 0) {
      throw new HttpError('Could not find location for the specified address.', 422);
    }

    if (!data.results[0].geometry || !data.results[0].geometry.location) {
      throw new HttpError('Invalid response from geocoding service.', 500);
    }

    const coordinates = data.results[0].geometry.location;

    return coordinates;
  } catch (err) {
    if (err.code) {
      throw err;
    }
    throw new HttpError('Failed to fetch coordinates from geocoding service.', 500);
  }
};

module.exports = getCoordsForAddress;

