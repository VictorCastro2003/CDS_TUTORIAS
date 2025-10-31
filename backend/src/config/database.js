import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'btldotgudhy1exb18sey',
  process.env.DB_USER || 'uver4zyp7czemcjo',
  process.env.DB_PASSWORD || '3RVgPRApcLX9SlcwepRe',
  {
    host: process.env.DB_HOST || 'btldotgudhy1exb18sey-mysql.services.clever-cloud.com',
    dialect: 'mysql',
    logging: false
  }
);

export default sequelize;