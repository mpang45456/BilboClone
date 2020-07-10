/**
 * Replaces any special characters in a regex
 * with the escaped version (i.e. prefixed with a
 * backslash '\'). Ensures that the entire string
 * is safe for use in a regex.
 * @param {String} str 
 */
export function escapeRegex(str) {
    // $& means the whole matched string
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}