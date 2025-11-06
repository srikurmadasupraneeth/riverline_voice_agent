export const auditEvent = (conv, type, data = {}) => {
  conv.audit.push({ type, at: new Date().toISOString(), ...data });
};
