import { Buffer } from "buffer";
import Busboy from "busboy";

/**
 * Gets content type from lambda event.
 */
export function getEventContentType(event: any) {
    const { headers = {} } = event;
    let contentType = headers["content-type"];
    if (!contentType) {
        contentType = headers["Content-Type"];
    }
    return contentType;
}

/**
 * Reads a raw form data request to get all fields.
 */
export async function getFormRequestFields(event: any) {
    if (!event.body) {
        return {};
    }

    return await new Promise((resolve, reject) => {
        const fields = {};
        const busboy = new Busboy({
            headers: {
                "content-type": getEventContentType(event),
            },
        });
        busboy.on(
            "file",
            (fieldname: string | number, file, filename: any, encoding: any, mimetype: any) => {
                interface IFile {
                    value: Buffer | string;
                    filename: string;
                    content_type: any;
                    encoding: any;
                    size: any;
                    extension: any;
                }
                const field: IFile = {} as IFile;
                const chunks = [];
                file.on("data", data => {
                    chunks.push(data);
                });
                file.on("end", () => {
                    field.value = Buffer.concat(chunks);
                    field.filename = filename;
                    field.content_type = mimetype;
                    field.encoding = encoding;
                    field.size = field.value.length;
                    fields[fieldname] = field;
                    const extensionMatcher = field.filename.match(/\.(.*)$/);
                    field.extension = extensionMatcher ? extensionMatcher[1] : null;
                });
            },
        );
        busboy.on("field", (fieldname, value) => {
            fields[fieldname] = value;
        });
        busboy.on("error", error => reject(`Parse error: ${error}`));
        busboy.on("finish", () => resolve(fields));

        busboy.write(event.body, event.isBase64Encoded ? "base64" : "binary");
        busboy.end();
    });
}

/**
 * Simple text format where params will be put in % characteres. Escape % with double %%.
 */
export function formatText(text: string, ...params: string[] | string[][]) {
    if (params[0] instanceof Array) {
        params = params[0] as string[];
    }
    let result = text || "";
    let pos = -1;
    for (let i = 0; i < params.length; i++) {
        pos = result.indexOf("%", pos + 1);
        if (pos === -1) {
            break;
        }
        if (result.charAt(pos + 1) === "%") {
            pos++;
            i--;
            continue;
        }
        if (pos !== -1) {
            result = result.substring(0, pos) + params[i] + result.substr(pos + 1, result.length);
            pos++;
        }
    }
    return result;
}

export const _ = {
    isEmpty(v: any) {
        let empty = (!v && v !== 0 && v !== false) || (Array.isArray(v) && v.length === 0);
        if (!empty && typeof v === "object") {
            empty = true;
            if (Object.keys(v).length > 0) {
                empty = false;
            }
        }
        return empty;
    },
    isInteger(v: any) {
        return parseInt(v, 10) === v;
    },
    without(arr: any[], ...exclusions: any) {
        const result = [];
        for (const item of arr) {
            let exclude = false;
            for (const exclusion of exclusions) {
                if (exclusion === item) {
                    exclude = true;
                }
            }
            if (!exclude) {
                result.push(item);
            }
        }
        return result;
    },
    isString(v: any) {
        return typeof v === "string";
    },
    isPlainObject(v: any) {
        return typeof v === "object" && !Array.isArray(v);
    },
    zeroFill(n: number, w: number) {
        w -= n.toString().length;
        if (w > 0) {
            return new Array(w + (/\./.test(n.toString()) ? 2 : 1)).join("0") + n;
        }
        return n + "";
    },
};
