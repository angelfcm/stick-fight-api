import ResponseError from "../models/ResponseError";

export interface IResponse {
    statusCode: number;
    headers: any;
    body: {
        errors: ResponseError[];
        status: string;
        data: any;
        meta: any;
    };
}

class ResponseBuilder {
    private response = {
        body: {
            data: null,
            errors: [],
            meta: null,
            status: "error",
        },
        headers: {},
        statusCode: 500,
    } as IResponse;

    public data(data: any) {
        this.response.body.data = data;
        return this;
    }

    public meta(meta: any) {
        this.response.body.meta = meta;
        return this;
    }

    public error(name: any, message: any) {
        this.response.body.errors.push(new ResponseError(name, message));
        return this;
    }

    public headers(headers: any) {
        this.response.headers = headers;
        return this;
    }

    public statusCode(statusCode: any) {
        this.response.statusCode = statusCode;
        return this;
    }

    public hasError() {
        return this.response.body.errors.length > 0;
    }

    public build() {
        // Auto set status code if itsn't defined.
        if (!this.response.statusCode) {
            this.response.statusCode = this.response.body.errors.length ? 400 : 200;
        }
        // Server and client errors.
        if (this.response.statusCode >= 400) {
            this.response.body.status = "error";
        } else {
            this.response.body.status = "ok";
        }
        // Set errors attr with not empty data if there are errors.
        const errorsFormat = {};
        if (this.response.body.errors.length) {
            // Auto set error code if itsn't defined.
            for (const err of this.response.body.errors) {
                errorsFormat[err.name || "error"] = err.message;
            }
        }
        // Build response as JSON string.
        const res = {} as any;
        if (this.response.statusCode) {
            res.statusCode = this.response.statusCode;
        }
        if (Array.isArray(this.response.headers)) {
            res.headers = this.response.headers;
        }
        if (this.response.body) {
            res.body = {} as any;
            if (Object.keys(errorsFormat).length > 0) {
                res.body.errors = errorsFormat;
            }
            if (this.response.body.status) {
                res.body.status = this.response.body.status;
            }
            if (this.response.body.data !== undefined && this.response.body.data !== null) {
                res.body.data = this.response.body.data;
            }
            if (this.response.body.meta !== undefined && this.response.body.meta !== null) {
                res.body.meta = this.response.body.meta;
            }
        }
        res.body = JSON.stringify(res.body);
        return res;
    }
}

export default ResponseBuilder;
