import Joi from 'joi';

export const serviceSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  risk: Joi.string().valid('low', 'medium', 'high').required(),
  category: Joi.string().valid('all_caps', 'large_&_mid_cap', 'mid_&_small_cap').required(),
  subcategory: Joi.when('category', {
    switch: [
        { is: 'all_caps', then: Joi.string().valid('multi_cap').required() },
        { is: 'large_&_mid_cap', then: Joi.string().valid('large_cap', 'mid_cap', 'large_&_mid_cap').required() },
        { is: 'mid_&_small_cap', then: Joi.string().valid('small_cap', 'mid_cap', 'mid_&_small_cap').required() }
    ]
}),
  price: Joi.number().min(0).required(),
});

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const subscriptionEmailSchema = Joi.object({
    email: Joi.string().email().required(),
})


// Helper function for validating data
export const validate = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(
      `Validation Error: ${error.details.map((d) => d.message).join(', ')}`
    );
  }
  return value;
};


export const validateSignUp = (data: { email: string, password: string }) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });

  return schema.validate(data);
};
export const validateUser = (user: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    address: Joi.string().min(5).max(100),
    phoneNumber: Joi.string().min(10).max(15),
    dateOfBirth: Joi.date(),
    country: Joi.string(),
    city: Joi.string(),
    zipCode: Joi.string(),
    profilePictureUrl: Joi.string().uri(),
    // Add more fields here as needed (e.g., 30+ fields)
    gender: Joi.string().valid('male', 'female', 'other'),
    occupation: Joi.string(),
    // Dynamic fields
    customField1: Joi.string().optional(),
    customField2: Joi.string().optional(),
    // More custom fields up to the required number
  });
  return schema.validate(user);
};