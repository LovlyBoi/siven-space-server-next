const CONFIG_DEV = {
  CACHE_DIR: '.siven_cache',
};

const CONFIG_PROD = {
  CACHE_DIR: '../.siven_cache',
};

export const config = () => {
  const env = process.env.RUNNING_ENV;
  return env === 'development' ? CONFIG_DEV : CONFIG_PROD;
};
