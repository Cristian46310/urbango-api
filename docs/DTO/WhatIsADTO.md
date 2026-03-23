# Data Transfer Object (DTO) Documentation

A DTO (Data Transfer Object) is a design pattern used in Java and Spring Boot
to transfer data between different layers of an application (e.g., controller,
service, and repository layers). It serves as a simple container for data with
minimal business logic.

## Key Characteristics:

- Contains only fields and getter/setter methods
- No business logic or database annotations
- Decouples internal entity models from external API responses
- Enables data validation and transformation

## Advantages:

1. Separation of Concerns: Keeps entity classes separate from API contracts
2. Security: Prevents exposing sensitive entity fields in API responses
3. Flexibility: Allows different data representations for various use cases
4. Validation: Enables input validation at the DTO level using annotations
5. Performance: Transfers only necessary data, reducing payload size
6. Maintainability: Protects internal structure from external changes

## Example:

```Java
// DTO for User data transfer
public record UserDTO(
	String id,
	String name,
	String email,
	String password
){}


// Usage in Controller
@PostMapping("/users")
public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
    // Service layer processes DTO and returns response
    return ResponseEntity.ok(userService.saveUser(userDTO));
}
```
