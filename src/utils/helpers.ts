export const prepareUserData = (
  email: string,
  phoneNumber: number,
  encryptedPassword: string
) => {
  return {
    pk: "USER",
    sk: email,
    id: email,
    email,
    phoneNumber,
    address: "",
    city: "",
    postal: "",
    country: "",
    password: encryptedPassword,
    profilePhoto: "",
    paymentInfo: [],
    verified: false,
  };
};
