import { defaultLocale } from "../core/constants";
import { formatText } from "../core/utils";
import * as map from "./map";

const translations = map;

class Translator {
    public locale: string;

    constructor(locale?: string) {
        this.locale = locale || defaultLocale;
    }
    /**
     * Gets trasnlation of given text if exists in lang files, otherwise returns the same text.
     * @param text text to translate
     * @returns translated text
     */
    public translate(text: string, ...params: string[] | string[][]): string {
        const found = translations[this.locale];
        if (found) {
            if (found[text]) {
                return formatText(found[text], ...params);
            } else {
                return formatText(text, ...params);
            }
        } else {
            return formatText(text, ...params);
        }
    }

    public setLocale(locale: string) {
        this.locale = locale;
    }
}

export default Translator;
