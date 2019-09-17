import Translator from "../lang/Translator";
import { defaultLocale } from "./constants";
import connect from "./db";
import ResponseBuilder from "./ResponseBuilder";
import { getEventContentType, getFormRequestFields } from "./utils";

/**
 * Field definition
 */
export interface IAppContext {
    /**
     * Helper for translation with locale already setted.
     */
    __: (text: string, ...params: string[]) => string;
    response: ResponseBuilder;
    /**
     * Event body content transformed into fields,
     */
    fields: any;
    /**
     * Path parameters.
     */
    pathParameters: any;
    /**
     * Here you can should pass data throw app cycle.
     */
    extras: any;
    /**
     * Default lambda event.
     */
    event: any;
    /**
     * Default lambda context.
     */
    context: any;
    /**
     * Defualt lambda callback.
     */
    callback: (err: any, res: any) => void;
    /**
     * Query string parameters.
     */
    queryParameters: any;
}
/**
 * This class is only used to define lambda custom event properties.
 */
type AppLambdaType = (
    appContext: IAppContext,
) => Promise<{ statusCode: number; body: string } | ResponseBuilder | void>;

/**
 * Returns main lambda middleware for control common lambda flow like uncatched exceptions, not builded responses and middlewares execution, a flow stops when current lambda in flow returns any value that should be a valid response.
 * @param connectToDB If this is explicitly false then it will avoid to start a db connection, if this is a function then it will interpreted as first lambda middleware.
 * @param {...function(EventDefinition, Object, Function)} lambdas  You can define multiple lambdas to act as middlewares until reach the final lambda function, ie. app(userAuth, validate, (event, context, callback) => { ... }).
 */
export default function app(...lambdas: AppLambdaType[]) {
    return async (event: any, context: any, callback: (err: any, res: any) => void) => {
        // Connect to db
        connect();
        // Get noticed when callback is used instead of promises.
        let callbackRes = null;
        const callbackFixed = (err: any, res: any) => {
            callbackRes = err || res;
            callback(err, res);
        };
        const appContext = {} as IAppContext;
        appContext.event = event || {};
        appContext.context = context;
        appContext.callback = callbackFixed;
        appContext.pathParameters = event.pathParameters || {};
        appContext.queryParameters = event.queryStringParameters || {};
        appContext.response = new ResponseBuilder();
        // Set default translator helper.
        const clientLang = event.headers ? event.headers["Accept-Language"] : defaultLocale;
        const translator = new Translator(clientLang);
        appContext.__ = (text: string, ...params: any) => translator.translate(text, ...params);
        // Try to convert json input to fields or form request to fields.
        const contentType = getEventContentType(event);
        if (contentType === "application/json") {
            try {
                appContext.fields = JSON.parse(event.body || "{}");
            } catch (err) {
                event.fields = {};
            }
        } else {
            appContext.fields = await getFormRequestFields(event);
        }
        try {
            for (let i = 0; i < lambdas.length; i++) {
                const lambda = lambdas[i];
                if (typeof lambda !== "function") {
                    return appContext.response
                        .error(
                            500,
                            `Parameter ${i} is not a valid lambda function to be executed by the app middleware.`,
                        )
                        .statusCode(500)
                        .build();
                }
                let lambdaResponse = lambda(appContext);
                // If lambda response is a function then execute it to expect a promise or valid response.
                if (typeof lambdaResponse === "function") {
                    lambdaResponse = (lambdaResponse as (
                        appContext: IAppContext,
                        event: any,
                        context: any,
                        callback: (err: any, res: any) => void,
                    ) => Promise<void>)(appContext, event, context, callback);
                }
                // If lambda response is a promise then wait for it and update lambda response.
                if (lambdaResponse instanceof Promise) {
                    lambdaResponse = (await lambdaResponse) as any;
                }
                // If response is a response builder then build it and return.
                if (lambdaResponse instanceof ResponseBuilder) {
                    return lambdaResponse.build();
                }
                // If callback is used then take its response if there is not lambda response.
                if (lambdaResponse === undefined && callbackRes) {
                    lambdaResponse = callbackRes;
                } else if (lambdaResponse !== undefined || i === lambdas.length - 1) {
                    if (typeof lambdaResponse === "object" && (lambdaResponse as any).statusCode) {
                        return lambdaResponse;
                    } else {
                        return appContext.response
                            .error(500, "Lambda response is not a valid json structure.")
                            .statusCode(500)
                            .build();
                    }
                }
            }
        } catch (err) {
            // tslint:disable-next-line: no-console
            console.log(err.stack);
            return appContext.response.error(500, err.message).build();
        }
    };
}
