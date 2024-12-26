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
