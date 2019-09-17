import customEnv from "custom-env";

/**
 * Checks if param name exists.
 */
export function hasParameter(paramName: string) {
    return process.argv.some(param => param === paramName);
}
/**
 * Checks if param name value exists.
 */
export function getParameterValue(paramName) {
    for (let i = 0; i < process.argv.length; i += 1) {
        const param = process.argv[i];
        if (param === paramName) {
            if (i + 1 < process.argv.length) {
                return process.argv[i + 1].replace("--", "");
            }
            return null;
        }
    }
    return null;
}
/**
 * Tries to load environment by --env command or throws exception.
 */
export function loadEnvOrFail() {
    if (hasParameter("--env")) {
        const envValue = getParameterValue("--env");
        let envValueFixed = envValue;
        if (envValue === "development") {
            envValueFixed = "dev";
        } else if (envValue === "production") {
            envValueFixed = "prod";
        }
        const loadedEnv = customEnv.env(envValueFixed);
        if (!loadedEnv.main.configDotEnv.path) {
            throw new Error("You must set an existent environment.");
        }
    } else {
        throw new Error("You must set --env paramater.");
    }
}
