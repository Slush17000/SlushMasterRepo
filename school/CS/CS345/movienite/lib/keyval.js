
// localStorage-backed drop-in replacement for the remote Keyval service.
// No server or API key required — all user data is stored in the browser.
class Keyval {

    constructor(api_key) {
        // api_key is no longer used but kept for interface compatibility
        this.api_key = api_key;
    }

    get(key, callback, error_callback = undefined) {
        try {
            const value = localStorage.getItem(key);
            // Match the original service's "not found" response string
            callback(value !== null ? value : "Resource Not Found");
        } catch (error) {
            if (error_callback !== undefined) {
                error_callback(error);
            }
        }
    }

    set(key, value, callback, error_callback = undefined) {
        try {
            localStorage.setItem(key, value);
            if (callback !== undefined) {
                callback(value);
            }
        } catch (error) {
            if (error_callback !== undefined) {
                error_callback(error);
            }
        }
    }

    delete(key, callback, error_callback = undefined) {
        try {
            localStorage.removeItem(key);
            if (callback !== undefined) {
                callback();
            }
        } catch (error) {
            if (error_callback !== undefined) {
                error_callback(error);
            }
        }
    }
}