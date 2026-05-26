; Beskid highlight queries

(identifier) @variable
(primitive_type) @type.builtin
(type_path) @type

(visibility) @keyword

[
  (let_statement)
  (return_statement)
  (if_statement)
  (while_statement)
  (for_statement)
  (match_expression)
] @keyword

(literal) @constant
(string_literal) @string
(integer_literal) @number
(float_literal) @number
(char_literal) @character
(wildcard_pattern) @keyword

(line_comment) @comment
(block_comment) @comment
(doc_comment) @comment.documentation

(function_definition name: (identifier) @function)
(impl_method name: (identifier) @function)
(macro_definition name: (identifier) @function)
(type_definition name: (identifier) @type.definition)
(enum_definition name: (identifier) @type.definition)
(contract_definition name: (identifier) @type.definition)
(host_definition name: (identifier) @module)
(test_definition name: (identifier) @function.test)
(member_access member: (identifier) @property)
(field_value name: (identifier) @property)
(attribute name: (identifier) @attribute)
(string_interpolation) @embedded
(try_operator) @operator
