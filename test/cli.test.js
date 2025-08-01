const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

describe('CLI Functionality', () => {
    const testTemplate = `{
    "user": {
        "name": @person.firstName,
        "email": @internet.email,
        "age": @number.int(18, 65)
    }
}`;

    const testArrayTemplate = `[
    {
        "name": @person.firstName,
        "id": @string.uuid
    }
] @repeat(3)`;

    beforeEach(() => {
        // Clean up any existing test files
        if (fs.existsSync('test-template.json')) {
            fs.unlinkSync('test-template.json');
        }
        if (fs.existsSync('test-output.json')) {
            fs.unlinkSync('test-output.json');
        }
    });

    afterEach(() => {
        // Clean up test files
        if (fs.existsSync('test-template.json')) {
            fs.unlinkSync('test-template.json');
        }
        if (fs.existsSync('test-output.json')) {
            fs.unlinkSync('test-output.json');
        }
    });

    test('should execute main function with sample.json', () => {
        const result = execSync('node main.js', { encoding: 'utf8' });
        
        expect(result).toContain('JSON Template Parser');
        expect(result).toContain('Generated Output');
        expect(result).toContain('Output saved to output.json');
        
        // Check that output.json was created
        expect(fs.existsSync('output.json')).toBe(true);
        
        // Parse and validate the output
        const outputContent = fs.readFileSync('output.json', 'utf8');
        const parsedOutput = JSON.parse(outputContent);
        expect(Array.isArray(parsedOutput)).toBe(true);
    });

    test('should handle CLI execution with different template', () => {
        // Create a test template file
        fs.writeFileSync('test-template.json', testTemplate);
        
        try {
            const result = execSync('node main.js -i test-template.json -o test-output.json', { encoding: 'utf8' });
            
            expect(result).toContain('JSON Template Parser');
            expect(fs.existsSync('test-output.json')).toBe(true);
            
            const output = JSON.parse(fs.readFileSync('test-output.json', 'utf8'));
            expect(output.user.name).toBeDefined();
            expect(output.user.email).toMatch(/@/);
            expect(output.user.age).toBeGreaterThanOrEqual(18);
            expect(output.user.age).toBeLessThanOrEqual(65);
            
        } finally {
            // No need to restore anything
        }
    });

    test('should handle CLI execution with array template', () => {
        // Create a test template file
        fs.writeFileSync('test-array-template.json', testArrayTemplate);
        
        try {
            const result = execSync('node main.js -i test-array-template.json -o test-array-output.json', { encoding: 'utf8' });
            
            expect(result).toContain('JSON Template Parser');
            expect(fs.existsSync('test-array-output.json')).toBe(true);
            
            const output = JSON.parse(fs.readFileSync('test-array-output.json', 'utf8'));
            expect(Array.isArray(output)).toBe(true);
            expect(output).toHaveLength(3);
            output.forEach(item => {
                expect(item.name).toBeDefined();
                expect(item.id).toBeDefined();
            });
            
        } finally {
            // Clean up test files
            if (fs.existsSync('test-array-template.json')) {
                fs.unlinkSync('test-array-template.json');
            }
            if (fs.existsSync('test-array-output.json')) {
                fs.unlinkSync('test-array-output.json');
            }
        }
    });

    test('should handle CLI execution and output', () => {
        // Create a simple valid template file
        fs.writeFileSync('test-simple-template.json', '{"message": "Hello World", "number": @number.int(1, 10)}');
        
        try {
            // This should run successfully
            const result = execSync('node main.js -i test-simple-template.json -o test-simple-output.json', { encoding: 'utf8' });
            
            expect(result).toContain('JSON Template Parser');
            expect(fs.existsSync('test-simple-output.json')).toBe(true);
            
            const output = JSON.parse(fs.readFileSync('test-simple-output.json', 'utf8'));
            expect(output.message).toBe('Hello World');
            expect(output.number).toBeGreaterThanOrEqual(1);
            expect(output.number).toBeLessThanOrEqual(10);
            
        } finally {
            // Clean up test files
            if (fs.existsSync('test-simple-template.json')) {
                fs.unlinkSync('test-simple-template.json');
            }
            if (fs.existsSync('test-simple-output.json')) {
                fs.unlinkSync('test-simple-output.json');
            }
        }
    });
});

describe('Module Export Functionality', () => {
    test('should export parse function', () => {
        const { parse } = require('../main.js');
        
        expect(parse).toBeDefined();
        expect(typeof parse).toBe('function');
    });

    test('should parse templates correctly', () => {
        const { parse } = require('../main.js');
        
        const template = '{"name": @person.firstName, "active": @boolean}';
        const result = parse(template);
        
        expect(result.name).toBeDefined();
        expect(typeof result.name).toBe('string');
        expect(typeof result.active).toBe('boolean');
    });
}); 