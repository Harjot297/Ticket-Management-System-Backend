export default interface UpdateTheatreBody {
  name: string;
  location: {
    city: string;
    addressLine: string;
    pincode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}
