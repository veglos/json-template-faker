# JSON Template Faker

A powerful JSON template parser that generates realistic fake data using faker.js with advanced templating features including `@repeat` functionality for arrays.

## Features

- 🎭 **Faker.js Integration**: Use any faker.js method with simple `@module.method` syntax
- 🔄 **Array Repetition**: Generate arrays of repeated data with `@repeat(n)` directive
- 🧮 **Parameter Support**: Pass parameters to faker methods: `@number.int(1, 100)`
- 🔗 **String Concatenation**: Combine values with expressions: `@person.firstName + " " + @person.lastName`
- 🏗️ **Nested Structures**: Support for complex nested objects and arrays
- 💻 **CLI Interface**: Command-line tool for processing template files
- 📦 **Node.js API**: Use programmatically in your Node.js applications

## Installation

```bash
npm install json-template-faker
```

Or if you want to use it globally:

```bash
npm install -g json-template-faker
```

## Quick Start

### CLI Usage

Create a template file (e.g., `template.jtf`):

```jtf
{
  "user": {
    "name": @person.firstName,
    "email": @internet.email,
    "age": @number.int(18, 65)
  }
}
```

Generate fake data:

```bash
# Using default files (input.jtf -> output.json)
node main.js

# Using custom files
node main.js -i template.jtf -o result.json

# Or with long options
node main.js --input template.jtf --output result.json
```

### File Extension (.jtf)

We recommend using the `.jtf` (JSON Template Faker) extension for your template files:

- ✅ **No Linter Errors**: Avoids JSON validation errors in editors
- 🎨 **Syntax Highlighting**: Custom syntax highlighting for template variables  
- 🔧 **Editor Support**: Proper bracket matching and indentation
- 📁 **Clear File Type**: Easy identification of template files

The project includes VS Code configuration for `.jtf` files. See [JTF_FORMAT.md](JTF_FORMAT.md) for detailed format documentation.

### Programmatic Usage

```javascript
const { parse } = require('json-template-faker');

const template = `{
  "user": {
    "name": @person.firstName,
    "email": @internet.email,
    "age": @number.int(18, 65)
  }
}`;

const result = parse(template);
console.log(result);
```

## Template Syntax

### Basic Faker Methods

Use any faker.js method with the `@module.method` syntax:

```json
{
  "name": @person.firstName,
  "lastName": @person.lastName,
  "email": @internet.email,
  "city": @location.city,
  "company": @company.name
}
```

### Methods with Parameters

Pass parameters to faker methods:

```json
{
  "age": @number.int(18, 100),
  "price": @commerce.price(10, 1000),
  "password": @internet.password(12)
}
```

### String Concatenation

Combine multiple values using the `+` operator:

```json
{
  "fullName": @person.firstName + " " + @person.lastName,
  "website": "https://" + @internet.domainWord + ".com",
  "profileUrl": "https://example.com/users/" + @internet.username
}
```

### Array Repetition with @repeat

Generate arrays of repeated elements:

```json
{
  "users": [
    {
      "name": @person.firstName,
      "email": @internet.email
    }
  ] @repeat(5)
}
```

### Complex Example

```json
[
  {
    "user": {
      "profile": {
        "firstName": @person.firstName,
        "lastName": @person.lastName,
        "fullName": @person.firstName + " " + @person.lastName,
        "email": @internet.email,
        "age": @number.int(18, 80)
      },
      "socialProfiles": [
        {
          "platform": "twitter",
          "username": @internet.username,
          "url": "https://twitter.com/" + @internet.username
        }
      ] @repeat(3),
      "orders": [
        {
          "id": @string.uuid,
          "product": @commerce.productName,
          "price": @commerce.price(10, 500),
          "quantity": @number.int(1, 5)
        }
      ] @repeat(2)
    }
  }
] @repeat(3)
```

## Supported Faker Modules

The parser supports all faker.js modules including:

- `@person.*` - Names, gender, age, etc.
- `@internet.*` - Email, username, domain, URL, etc.
- `@location.*` - Address, city, country, coordinates, etc.
- `@commerce.*` - Product names, prices, departments, etc.
- `@company.*` - Company names, business info, etc.
- `@lorem.*` - Lorem ipsum text generation
- `@number.*` - Numbers, integers, floats
- `@date.*` - Dates, timestamps
- `@string.*` - UUIDs, random strings
- `@phone.*` - Phone numbers
- `@finance.*` - Account numbers, credit cards, etc.

For a complete list of available methods, refer to the [Faker.js documentation](https://fakerjs.dev/).

## CLI Options

```
Usage: json-template-faker [options]

Options:
  -i, --input <file>    Input template file (default: sample.json)
  -o, --output <file>   Output file (default: output.json)
  -h, --help           Show help message

Examples:
  json-template-faker
  json-template-faker -i template.json -o result.json
  json-template-faker --input my-template.json --output my-output.json
```

## API Reference

### `parse(templateString)`

Parses a template string and returns the generated object with fake data.

**Parameters:**
- `templateString` (string): JSON template string with faker variables

**Returns:**
- Object or Array with generated fake data

**Example:**
```javascript
const { parse } = require('json-template-faker');

const template = '{"name": @person.firstName, "age": @number.int(18, 100)}';
const result = parse(template);
// { name: "John", age: 25 }
```

## Examples

### User Profile Generator

```json
{
  "id": @string.uuid,
  "profile": {
    "firstName": @person.firstName,
    "lastName": @person.lastName,
    "displayName": @person.firstName + " " + @person.lastName,
    "email": @internet.email,
    "avatar": "https://api.example.com/avatars/" + @string.uuid + ".jpg"
  },
  "preferences": {
    "theme": @helpers.arrayElement(['light', 'dark']),
    "language": @helpers.arrayElement(['en', 'es', 'fr', 'de'])
  },
  "activity": {
    "lastLogin": @date.recent,
    "joinDate": @date.past
  }
}
```

### E-commerce Product Catalog

```json
{
  "products": [
    {
      "id": @string.uuid,
      "name": @commerce.productName,
      "description": @commerce.productDescription,
      "price": @commerce.price(10, 1000),
      "category": @commerce.department,
      "inStock": @datatype.boolean,
      "tags": [
        @commerce.productAdjective
      ] @repeat(3)
    }
  ] @repeat(10)
}
```

### Test Data for APIs

```json
[
  {
    "userId": @string.uuid,
    "username": @internet.username,
    "email": @internet.email,
    "posts": [
      {
        "id": @string.uuid,
        "title": @lorem.sentence,
        "content": @lorem.paragraphs,
        "createdAt": @date.recent,
        "likes": @number.int(0, 1000)
      }
    ] @repeat(5)
  }
] @repeat(20)
```

## Requirements

- Node.js >= 14.0.0
- Dependencies: `@faker-js/faker`

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Submit a pull request

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/your-username/json-template-faker/issues) on GitHub.
