import chai from "chai";
import chaiHttp from "chai-http";
import { loadEnvOrFail } from "../../core/cli-utils";

loadEnvOrFail();

chai.use(chaiHttp);

export const agent = chai.request.agent(process.env.app_url);
