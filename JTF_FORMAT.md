# JSON Template Faker (.jtf) Format

The `.jtf` (JSON Template Faker) file extension is used for JSON template files that contain special faker.js variables and directives for generating fake data.

## File Extension

- **Extension**: `.jtf`
- **MIME Type**: `application/json-template-faker`
- **Description**: JSON Template Faker format

## Syntax

The `.jtf` format extends JSON with the following special syntax:

### 1. Faker Variables

Use `@namespace.method` syntax to insert faker.js generated data:

```jtf
{
    "name": @person.firstName,
    "email": @internet.email,
    "age": @number.int(18, 100)
}
```

### 2. String Concatenation

Combine strings and faker variables using `+` operator:

```jtf
{
    "fullName": @person.firstName + " " + @person.lastName,
    "website": "https://" + @internet.domainWord + ".com"
}
```

### 3. Array Repetition

Use `@repeat(n)` directive after arrays to generate multiple items:

```jtf
{
    "users": [
        {
            "name": @person.firstName,
            "email": @internet.email
        }
    ] @repeat(5)
}
```

### 4. Root-Level Repetition

Apply `@repeat(n)` to the entire template:

```jtf
[
    {
        "id": @string.uuid,
        "name": @person.firstName
    }
] @repeat(3)
```

## Supported Faker Namespaces

- `@person.*` - Names, personal data
- `@internet.*` - Email, URLs, usernames
- `@location.*` - Addresses, cities, states
- `@commerce.*` - Products, prices, departments
- `@number.*` - Integers, floats with parameters
- `@string.*` - UUIDs, alphanumeric strings
- `@lorem.*` - Lorem ipsum text
- `@date.*` - Dates and timestamps
- `@phone.*` - Phone numbers
- And many more...

## Function Parameters

Many faker methods accept parameters:

```jtf
{
    "age": @number.int(18, 65),
    "price": @commerce.price(10, 1000),
    "password": @internet.password(12)
}
```

## Static Data

Mix template variables with static data:

```jtf
{
    "user": {
        "name": @person.firstName,
        "role": "admin",
        "active": true,
        "loginCount": 0
    }
}
```

## Editor Support

### VS Code

The project includes VS Code configuration files:

- `.vscode/settings.json` - File associations and validation settings
- `.vscode/jtf.tmLanguage.json` - Syntax highlighting grammar
- `.vscode/language-configuration.json` - Bracket matching and indentation

### Other Editors

For other editors, you can:

1. Associate `.jtf` files with JSON syntax highlighting
2. Disable JSON validation/linting for `.jtf` files
3. Use the TextMate grammar provided for syntax highlighting

## Usage

1. Create a `.jtf` file with your template
2. Run the parser: `node main.js -i template.jtf -o output.json`
3. Generated JSON will be saved to the output file

## Example Template

```jtf
[
    {
        "user": {
            "name": @person.firstName,
            "lastName": @person.lastName,
            "fullName": @person.firstName + " " + @person.lastName,
            "age": @number.int(18, 100),
            "email": @internet.email,
            "address": {
                "street": @location.street,
                "city": @location.city,
                "state": @location.state,
                "zip": @location.zipCode
            },
            "orders": [
                {
                    "id": @string.uuid,
                    "product": @commerce.productName,
                    "price": @commerce.price,
                    "quantity": @number.int(1, 5)
                }
            ] @repeat(3)
        }
    }
] @repeat(2)
```

This will generate 2 users, each with 3 random orders. 