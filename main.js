#!/usr/bin/env node

const { faker } = require('@faker-js/faker');

// Setup faker methods mapping
function setupFakerMethods() {
    return {
        // === DATATYPE MODULE ===
        boolean: () => faker.datatype.boolean(),
    };
}

function parseVariableOrFunction(varExpression) {
    // Remove the @ prefix
    const expr = varExpression.substring(1);

    // Check if it's a faker namespace call like person.firstName or number.int(1, 100)
    const namespaceMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*(\([^)]*\))?$/);

    if (namespaceMatch) {
        const module = namespaceMatch[1];
        const method = namespaceMatch[2];
        const paramString = namespaceMatch[3];

        // Parse parameters if they exist
        let params = [];
        if (paramString) {
            const innerParams = paramString.slice(1, -1).trim(); // Remove parentheses
            if (innerParams) {
                params = innerParams.split(',').map(param => {
                    const trimmed = param.trim();
                    // Try to parse as number, otherwise keep as string
                    const num = Number(trimmed);
                    return isNaN(num) ? trimmed : num;
                });
            }
        }

        // Call faker directly using namespace syntax
        try {
            let result;
            if (faker[module] && typeof faker[module][method] === 'function') {
                if (params.length > 0) {
                    // For methods that need parameters as an object (most faker methods)
                    if (method === 'int' || method === 'float') {
                        result = faker[module][method]({ min: params[0] || 1, max: params[1] || 100 });
                    } else if (method === 'price') {
                        result = faker[module][method]({ min: params[0] || 1, max: params[1] || 1000 });
                    } else if (method === 'password') {
                        result = faker[module][method]({ length: params[0] || 15 });
                    } else if (method === 'state') {
                        result = faker[module][method]({ abbreviated: true });
                    } else if (method === 'recent' || method === 'future' || method === 'past' || method === 'soon') {
                        // Handle date methods that return dates, convert to string
                        const dateResult = faker[module][method](...(params.length > 0 ? [{ days: params[0] || 30 }] : []));
                        result = dateResult.toISOString().split('T')[0];
                    } else if (method === 'birthdate') {
                        // Handle birthdate with age parameters
                        const dateResult = faker[module][method]({ min: params[0] || 18, max: params[1] || 80, mode: 'age' });
                        result = dateResult.toISOString().split('T')[0];
                    } else {
                        // Try both parameter styles
                        try {
                            result = faker[module][method](...params);
                        } catch {
                            result = faker[module][method]({ min: params[0], max: params[1] });
                        }
                    }
                } else {
                    // Handle methods that need special configuration
                    if (method === 'state') {
                        result = faker[module][method]({ abbreviated: true });
                    } else if (method === 'price') {
                        result = faker[module][method]({ min: 1, max: 1000 });
                    } else if (method === 'recent' || method === 'future' || method === 'past' || method === 'soon') {
                        // Handle date methods that return dates, convert to string
                        const dateResult = faker[module][method]();
                        result = dateResult.toISOString().split('T')[0];
                    } else if (method === 'birthdate') {
                        // Handle birthdate
                        const dateResult = faker[module][method]({ min: 18, max: 80, mode: 'age' });
                        result = dateResult.toISOString().split('T')[0];
                    } else {
                        result = faker[module][method]();
                    }
                }
                
                return result;
            } else {
                console.warn(`Unknown faker method: ${module}.${method}`);
                return `${module}.${method}`;
            }
        } catch (error) {
            console.warn(`Error calling faker.${module}.${method}:`, error.message);
            return `${module}.${method}`;
        }
    }

    // If no namespace syntax found, check if it's a simple variable in fakerMethods
    const fakerMethods = setupFakerMethods();
    if (fakerMethods[expr]) {
        return fakerMethods[expr]();
    } else {
        // Fallback for unknown variables
        console.warn(`Unknown variable: ${expr}, using faker.lorem.word()`);
        return faker.lorem.word();
    }
}

function parseExpression(expression) {
    // Handle string concatenation like: @first_name + " " + @last_name
    // Also handle expressions that start with quotes like: "https://" + @first_name + ".com"
    if (expression.includes('+')) {
        const parts = expression.split('+').map(part => part.trim());
        let result = '';

        for (const part of parts) {
            if (part.startsWith('@')) {
                result += parseVariableOrFunction(part);
            } else if (part.startsWith('"') && part.endsWith('"')) {
                result += part.slice(1, -1); // Remove quotes
            } else if (part.startsWith("'") && part.endsWith("'")) {
                result += part.slice(1, -1); // Remove quotes
            } else {
                // Handle unquoted strings (shouldn't happen but just in case)
                result += part;
            }
        }
        return result;
    }

    // Single variable or function call
    if (expression.startsWith('@')) {
        return parseVariableOrFunction(expression);
    }

    return expression;
}

function parseObject(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => {
            // Check if array item is a variable or function call (including namespace syntax)
            if (typeof item === 'string' && (
                item.startsWith('@') ||
                (item.includes('@') && (item.includes('+') || /\.[a-zA-Z_]/.test(item) || /\([^)]*\)/.test(item)))
            )) {
                return parseExpression(item);
            } else {
                return parseObject(item);
            }
        });
    }

    if (obj && typeof obj === 'object') {
        const result = {};

        for (const [key, value] of Object.entries(obj)) {
            // Check if this is an expression (starts with @, contains namespace syntax, or has expressions)
            if (typeof value === 'string' && (
                value.startsWith('@') ||
                (value.includes('@') && (value.includes('+') || /\.[a-zA-Z_]/.test(value) || /\([^)]*\)/.test(value)))
            )) {
                result[key] = parseExpression(value);
            } else {
                result[key] = parseObject(value);
            }
        }

        return result;
    }

    return obj;
}

function processRepeat(template, repeatCount) {
    // Create array with repeated elements
    const result = [];
    for (let i = 0; i < repeatCount; i++) {
        // Generate fresh values for each iteration
        result.push(parseObject(template));
    }
    return result;
}

function processArrayTemplates(obj, arrayTemplates) {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            processArrayTemplates(obj[i], arrayTemplates);
        }
    } else if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string' && value.startsWith('__REPEAT_') && value.endsWith('__')) {
                const arrayId = value.slice(9, -2); // Remove __REPEAT_ and __
                if (arrayTemplates.has(arrayId)) {
                    const template = arrayTemplates.get(arrayId);
                    try {
                        // Process the array content to handle @variables and expressions
                        let arrayContent = template.content;

                        // Handle complex expressions (with + operators) within the array content
                        const expressionMap = new Map();
                        let expressionCounter = 0;

                        const arrayExpressionRegex = /("[^"]*"\s*\+\s*@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?(?:\s*\+\s*(?:"[^"]*"|@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?)\s*)*|@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?\s*\+\s*(?:"[^"]*"|@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?)\s*(?:\+\s*(?:"[^"]*"|@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?)\s*)*)/g;

                        arrayContent = arrayContent.replace(arrayExpressionRegex, (match) => {
                            const placeholder = `__EXPR_${expressionCounter++}__`;
                            expressionMap.set(placeholder, match.trim());
                            return `"${placeholder}"`;
                        });

                        // Handle @variables and @function() calls in array content
                        arrayContent = arrayContent.replace(/(?<!")(@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?)(?!")/g, '"$1"');

                        const parsedArray = JSON.parse(arrayContent);

                        // Restore expressions in the parsed array
                        restoreExpressions(parsedArray, expressionMap);

                        if (Array.isArray(parsedArray) && parsedArray.length > 0) {
                            obj[key] = processRepeat(parsedArray[0], template.repeat);
                        }
                    } catch (e) {
                        obj[key] = [];
                    }
                }
            } else {
                processArrayTemplates(value, arrayTemplates);
            }
        }
    }
}

function restoreExpressions(obj, expressionMap) {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            if (typeof obj[i] === 'string' && expressionMap.has(obj[i])) {
                obj[i] = expressionMap.get(obj[i]);
            } else if (typeof obj[i] === 'object') {
                restoreExpressions(obj[i], expressionMap);
            }
        }
    } else if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string' && expressionMap.has(value)) {
                obj[key] = expressionMap.get(value);
            } else if (typeof value === 'object') {
                restoreExpressions(value, expressionMap);
            }
        }
    }
}

function parseTemplateString(templateStr) {
    // Custom parser to handle the template syntax
    let current = templateStr.trim();

    // Handle @repeat directives that come after arrays: ] @repeat(n)
    // Store array templates in a map and replace with simple markers
    const arrayTemplates = new Map();
    let arrayCounter = 0;

    // Process @repeat directives one at a time to avoid conflicts
    let hasRepeat = true;
    while (hasRepeat) {
        const repeatRegex = /@repeat\((\d+)\)/;
        const repeatMatch = repeatRegex.exec(current);

        if (!repeatMatch) {
            hasRepeat = false;
            break;
        }

        const repeatPos = repeatMatch.index;
        const repeatCount = parseInt(repeatMatch[1]);

        // Find the closing ] that precedes this @repeat
        let bracketPos = repeatPos - 1;
        while (bracketPos >= 0 && /\s/.test(current[bracketPos])) {
            bracketPos--; // Skip whitespace
        }

        if (current[bracketPos] === ']') {
            // Find the matching opening [
            let bracketCount = 1;
            let startPos = bracketPos - 1;
            while (startPos >= 0 && bracketCount > 0) {
                if (current[startPos] === ']') bracketCount++;
                else if (current[startPos] === '[') bracketCount--;
                startPos--;
            }
            startPos++; // Adjust for the found [

            if (bracketCount === 0) {
                // Extract the array content
                const arrayContent = current.substring(startPos, bracketPos + 1);
                const arrayId = `ARRAY_${arrayCounter++}`;

                arrayTemplates.set(arrayId, { content: arrayContent, repeat: repeatCount });

                // Replace the array + @repeat with a placeholder
                const beforeArray = current.substring(0, startPos);
                const afterRepeat = current.substring(repeatMatch.index + repeatMatch[0].length);
                current = beforeArray + `"__REPEAT_${arrayId}__"` + afterRepeat;
            } else {
                // If we couldn't find matching brackets, stop to avoid infinite loop
                hasRepeat = false;
            }
        } else {
            // If there's no ] before @repeat, stop to avoid infinite loop
            hasRepeat = false;
        }
    }

    // Create a map to store expressions and replace them with placeholders
    const expressionMap = new Map();
    let expressionCounter = 0;

    // Find and replace complex expressions (with + operators)
    // Updated regex to handle namespace syntax like @person.firstName or @number.int(1,100)
    const expressionRegex = /("[^"]*"\s*\+\s*@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?(?:\s*\+\s*(?:"[^"]*"|@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?)\s*)*|@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?\s*\+\s*(?:"[^"]*"|@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?)\s*(?:\+\s*(?:"[^"]*"|@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?)\s*)*)/g;

    current = current.replace(expressionRegex, (match) => {
        const placeholder = `__EXPR_${expressionCounter++}__`;
        expressionMap.set(placeholder, match.trim());
        return `"${placeholder}"`;
    });

    // Replace @namespace.method and @namespace.method() calls with quoted versions for JSON parsing
    current = current.replace(/(?<!")(@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\([^)]*\))?)(?!")/g, '"$1"');

    // Parse as JSON
    const parsed = JSON.parse(current);

    // Restore expressions
    restoreExpressions(parsed, expressionMap);

    // Process array templates
    processArrayTemplates(parsed, arrayTemplates);

    return parsed;
}

function parseTemplate(templateStr) {
    try {
        // Remove the descriptive text and extract just the JSON template
        let jsonStart, jsonEnd, jsonTemplate;

        // Check if the template starts with an array or object
        const firstBrace = templateStr.indexOf('{');
        const firstBracket = templateStr.indexOf('[');

        if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
            // Template starts with an array
            jsonStart = firstBracket;
            jsonEnd = templateStr.lastIndexOf(']') + 1;

            // Check if there's a @repeat directive after the closing ]
            const remainingText = templateStr.substring(jsonEnd).trim();
            const repeatMatch = remainingText.match(/^@repeat\((\d+)\)/);
            if (repeatMatch) {
                // Handle root-level @repeat directive
                const baseTemplate = templateStr.substring(jsonStart, jsonEnd);
                const repeatCount = parseInt(repeatMatch[1]);

                // Parse the base template (without @repeat)
                const baseResult = parseTemplateString(baseTemplate);
                const processedBase = parseObject(baseResult);

                // If the base result is an array, repeat each element
                if (Array.isArray(processedBase)) {
                    const result = [];
                    // The base template is an array, repeat the objects inside it
                    for (let i = 0; i < repeatCount; i++) {
                        const newResult = parseTemplateString(baseTemplate);
                        const parsedResult = parseObject(newResult);

                        // Add each object from the parsed array to the result
                        if (Array.isArray(parsedResult)) {
                            result.push(...parsedResult);
                        }
                    }
                    return result;
                } else {
                    // If base result is an object, create an array with repeated objects
                    const result = [];
                    for (let i = 0; i < repeatCount; i++) {
                        const newResult = parseTemplateString(baseTemplate);
                        result.push(parseObject(newResult));
                    }
                    return result;
                }
            }
        } else {
            // Template starts with an object
            jsonStart = firstBrace;
            jsonEnd = templateStr.lastIndexOf('}') + 1;

            // @repeat is not allowed after closing braces, only after arrays
            // So we don't check for @repeat here anymore
        }

        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error('No valid JSON template found');
        }

        jsonTemplate = templateStr.substring(jsonStart, jsonEnd);

        // Parse the template as a JavaScript object (allowing unquoted variables)
        const template = parseTemplateString(jsonTemplate);
        return parseObject(template);
    } catch (error) {
        console.error('Error parsing template:', error.message);
        throw error;
    }
}

// Public API function
function parse(templateStr) {
    return parseTemplate(templateStr);
}

// CLI functionality
function main() {
    const fs = require('fs');
    const path = require('path');

    // Parse command line arguments
    const args = process.argv.slice(2);
    let inputFile = 'input.jtf';
    let outputFile = 'output.json';

    // Parse CLI arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-i' || args[i] === '--input') {
            if (i + 1 < args.length) {
                inputFile = args[i + 1];
                i++; // Skip next argument as it's the input file
            }
        } else if (args[i] === '-o' || args[i] === '--output') {
            if (i + 1 < args.length) {
                outputFile = args[i + 1];
                i++; // Skip next argument as it's the output file
            }
        } else if (args[i] === '-h' || args[i] === '--help') {
            console.log(`
JSON Template Parser

Usage: node main.js [options]

Options:
  -i, --input <file>    Input template file (default: input.jtf)
  -o, --output <file>   Output file (default: output.json)
  -h, --help           Show this help message

Examples:
  node main.js
  node main.js -i template.jtf -o result.json
  node main.js --input my-template.jtf --output my-output.json
            `);
            return;
        } else if (!args[i].startsWith('-')) {
            // If it's not a flag, treat as input file
            inputFile = args[i];
        }
    }

    try {
        // Check if input file exists
        if (!fs.existsSync(inputFile)) {
            console.error(`❌ Error: Input file '${inputFile}' not found`);
            process.exit(1);
        }

        // Read the template from input file
        const templateContent = fs.readFileSync(inputFile, 'utf8');

        console.log('=== JSON Template Parser ===\n');
        console.log(`Input: ${inputFile}`);
        console.log(`Output: ${outputFile}\n`);
        console.log('Template:');
        console.log('─'.repeat(50));

        // Extract and display just the template part
        let templateStart, templateEnd, template;

        // Check if the template starts with an array or object
        const firstBrace = templateContent.indexOf('{');
        const firstBracket = templateContent.indexOf('[');

        if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
            // Template starts with an array
            templateStart = firstBracket;
            templateEnd = templateContent.lastIndexOf(']') + 1;

            // Check if there's a @repeat directive after the closing ]
            const remainingText = templateContent.substring(templateEnd).trim();
            const repeatMatch = remainingText.match(/^@repeat\((\d+)\)/);
            if (repeatMatch) {
                templateEnd += remainingText.indexOf(repeatMatch[0]) + repeatMatch[0].length;
            }
        } else {
            // Template starts with an object
            templateStart = firstBrace;
            templateEnd = templateContent.lastIndexOf('}') + 1;

            // Check if there's a @repeat directive after the closing }
            const remainingText = templateContent.substring(templateEnd).trim();
            const repeatMatch = remainingText.match(/^@repeat\((\d+)\)/);
            if (repeatMatch) {
                templateEnd += remainingText.indexOf(repeatMatch[0]) + repeatMatch[0].length;
            }
        }

        template = templateContent.substring(templateStart, templateEnd);
        console.log(template);

        console.log('\n' + '─'.repeat(50));
        console.log('Generated Output:');
        console.log('─'.repeat(50));

        // Parse and generate the output
        const result = parse(templateContent);

        console.log(JSON.stringify(result, null, 2));

        // Save the result to a file
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        console.log(`\n✅ Output saved to ${outputFile}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Export public API
module.exports = { parse };

// Run CLI if this file is executed directly
if (require.main === module) {
    main();
}

