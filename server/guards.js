export class AppError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export function requireUser(req) {
  if (!req.user) throw new AppError(401, "auth_required");
  return req.user;
}

export function found(row, code = "not_found") {
  if (!row) throw new AppError(404, code);
  return row;
}

export const idParam = {
  type: "object",
  properties: { id: { type: "string", minLength: 1, maxLength: 80 } },
  required: ["id"],
};

export const body = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required,
});

export const text = (maxLength, minLength = 0) => ({ type: "string", minLength, maxLength });
