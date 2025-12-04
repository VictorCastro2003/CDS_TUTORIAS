// jest.config.js (Backend)
export default {
  testEnvironment: "node",
  verbose: true,
  transform: {},
  // Asegurar que Jest maneje archivos .js como ES Modules
  
  // Permitir transformaciones si usas import/export
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};