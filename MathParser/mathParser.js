let debug = false

// 8 + 13 / 4
//        ^
function exprOffset(expr, offset) {
    let s = expr + "\n" + "-".repeat(offset) + "^"
    return s
}

class LexerException {
    constructor(errorStr, expr, offset) {
        this.msg = errorStr + "\n" + exprOffset(expr, offset)
    }
    toString() {
        return this.msg
    } 
}

class ParseException {
    constructor(msg) {
        this.msg = msg
    }
    toString() {
        return this.msg
    } 
}

// regular expression helper object
class Regex {
    constructor(regex) {
        this.regex = regex
        this.m = null
    }
    match(s) {
      this.m = s.match(this.regex)
      return this.m != null
    }
    group(n) {
       return this.m[n]
    }
}

class Token {
    constructor(str) {
        this.str = str
    }
    toString() {
        return this.str
    }
}

class Number extends Token {
    constructor(str, val) {
        super(str)
        this.val  = val
    }
}

class MathFunc extends Token {
    constructor(str, func) {
        super(str)
        this.func = func
    }
}

class UnaryMinus extends Token {
    constructor() {
        super("unary -")
    }
}

class UnaryPlus extends Token {
    constructor() {
        super("unary +")
    }
}

class LParen extends Token {
    constructor() {
        super("(")
    }
}

class RParen extends Token {
    constructor() {
        super(")")
    }
}

class BinaryOperator extends Token {
    constructor(str, precedence, associative, func) {
        super(str)
        this.precedence = precedence   // integer number. higher or same precedence binary operations are performed first
        this.associative = associative // "left" or "right"
        this.func = func
    }
}

// lex states
const Lexer_START           = 0 // expect the things that can come at the start of an expression
const Lexer_AFTER_NUM       = 1 // expect the things that can follow a number or number like sub expression
const Lexer_AFTER_FUNC      = 2 //

// Lexer.state to string
function lexStateStr(state) {
    switch (state) {
        case Lexer_START      : return "START";
        case Lexer_AFTER_NUM  : return "AFTER_NUM";
        case Lexer_AFTER_FUNC : return "AFTER_FUNC";
        default               : return state;
    }
}

// floats: 2.4178516392292583e+24
//         1.125
//         .333
//         5.
// TODO 2.4178516392292583e+24
const float_regex       = new Regex(/^[+-]?([0-9]+\.[0-9]+e[+-][0-9]+|[0-9]+\.[0-9]+|\.[0-9]+|[0-9]+\.)/)
const decimal_regex     = new Regex(/^[+-]?([0-9]+|[0-9]+e[+-][0-9]+)/)
const hexidecimal_regex = new Regex(/^0[xX][0-9a-fA-F]+/)

// lexer to recognizer tokens in a mathematical expression
class Lexer {

    constructor(expr) {
        this.i = 0
        this.state = Lexer_START
        this.expr = expr

        if (debug) {
            console.log("lex state=" + lexStateStr(this.state))
        }
    }

    getToken() {

        // skip over white space
        while (this.i < this.expr.length && (this.expr[this.i] == " " || this.expr[this.i] == "\t")) {
            this.i += 1
        }

        if (debug) {
            console.log(exprOffset(this.expr, this.i))
        }

        if (this.i < this.expr.length) {

            let ex = this.expr.slice(this.i)

            if (this.state == Lexer_START) {

                // float
                if (float_regex.match(ex)) {
                    let str = float_regex.group(0)
                    this.i += str.length
                    this.state = Lexer_AFTER_NUM
                    return new Number(str, parseFloat(str))

                // integer (decimal)
                } else if (decimal_regex.match(ex)) {
                    let str = decimal_regex.group(0)
                    this.i += str.length
                    this.state = Lexer_AFTER_NUM
                    return new Number(str, parseInt(str))

                // integer (hexidecimal)
                } else if (hexidecimal_regex.match(ex)) {
                    let str = hexidecimal_regex.group(0)
                    this.i += str.length
                    this.state = Lexer_AFTER_NUM
                    return new Number(str, parseInt(str, 16))

                // pi
                } else if (ex.startsWith("pi")) {
                    this.i += "pi".length
                    this.state = Lexer_AFTER_NUM
                    return new Number("pi", Math.PI)

                // unary plus
                } else if (ex.startsWith("+")) {
                    this.i += "+".length
                    return new UnaryPlus()

                // unary minus
                } else if (ex.startsWith("-")) {
                    this.i += "-".length
                    return new UnaryMinus()

                } else if (ex.startsWith("(")) {
                    this.i += "(".length
                    return new LParen()

                } else if (ex.startsWith("round")) {
                    this.i += "round".length
                    this.state = Lexer_AFTER_FUNC
                    return new MathFunc("round", (a) => Math.round(a))

                } else if (ex.startsWith("abs")) {
                    this.i += "abs".length
                    this.state = Lexer_AFTER_FUNC
                    return new MathFunc("abs", (a) => Math.abs(a))

                } else if (ex.startsWith("sqrt")) {
                    this.i += "sqrt".length
                    this.state = Lexer_AFTER_FUNC
                    return new MathFunc("sqrt", (a) => Math.sqrt(a))

                } else if (ex.startsWith("sin")) {
                    this.i += "sin".length
                    this.state = Lexer_AFTER_FUNC
                    return new MathFunc("sin", (a) => Math.sin(a))

                } else if (ex.startsWith("cos")) {
                    this.i += "cos".length
                    this.state = Lexer_AFTER_FUNC
                    return new MathFunc("cos", (a) => Math.cos(a))

                } else if (ex.startsWith("tan")) {
                    this.i += "tan".length
                    this.state = Lexer_AFTER_FUNC
                    return new MathFunc("tan", (a) => Math.tan(a))

                } else {
                    throw new LexerException("unexpected input", this.expr, this.i)
                }

            } else if (this.state == Lexer_AFTER_FUNC) {

                // expect open parenthesis
                if (ex.startsWith("(")) {
                    this.i += "(".length
                    this.state = Lexer_START
                    return new LParen()
                } else {
                    throw new LexerException("unexpected input", this.expr, this.i)
                }

            } else if (this.state == Lexer_AFTER_NUM) {

                if (ex.startsWith(")")) {
                    this.i += ")".length
                    return new RParen()

                } else if (ex.startsWith("^")) {
                    this.i += "^".length
                    this.state = Lexer_START
                    return new BinaryOperator("^", 4, "right", (a, b) => a ** b)

                } else if (ex.startsWith("*")) {
                    this.i += "*".length
                    this.state = Lexer_START
                    return new BinaryOperator("*", 3, "left",  (a, b) => a * b)

                } else if (ex.startsWith("/")) {
                    this.i += "/".length
                    this.state = Lexer_START
                    return new BinaryOperator("/", 3, "left",  (a, b) => a / b)

                } else if (ex.startsWith("%")) {
                    this.i += "%".length
                    this.state = Lexer_START
                    return new BinaryOperator("%", 3, "left",  (a, b) => a % b)

                } else if (ex.startsWith("+")) {
                    this.i += "+".length
                    this.state = Lexer_START
                    return new BinaryOperator("+", 2, "left",  (a, b) => a + b)

                } else if (ex.startsWith("-")) {
                    this.i += "-".length
                    this.state = Lexer_START
                    return new BinaryOperator("-", 2, "left",  (a, b) => a - b)
                } else {
                    throw new LexerException("unexpected input", this.expr, this.i)
                }
            }
        }

        return null
    }
}

class MathParser {
    constructor() {
        this.operand_stack  = []
        this.operator_stack = []
    }

    // multi-argument functions to add. ex: min(3, (1+1), 7) -> 2
    // min()
    // max()
    dump_stacks() {
        if (debug) {
            console.log("operand_stack=[ " + this.operand_stack.join(", ") + " ]")
            console.log("operator_stack=[ " + this.operator_stack.join(", ") + " ]")
            console.log("=".repeat(20))
        }
    }

    unary_minus_on_top_of_operator_stack() {
        return this.operator_stack.length > 0 &&
               this.operator_stack[this.operator_stack.length - 1] instanceof UnaryMinus
    }

    negate_operand_on_top_of_operand_stack() {
        // pop the unary minus from the operaror_stack
        this.operator_stack.pop()
        // negate the operand
        this.operand_stack.push(0 - this.operand_stack.pop())
    }

    apply_unary_minus() {
        while (this.unary_minus_on_top_of_operator_stack()) {
            this.negate_operand_on_top_of_operand_stack();
        }
        this.dump_stacks()
    }

    operands_append(number) {
        this.operand_stack.push(number)
        this.apply_unary_minus()
    }

    evaluate(expr) {

        let lex = new Lexer(expr)

        let token = lex.getToken()

        if (debug) {
            console.log("lex state=" + lexStateStr(lex.state))
        }

        while (token != null) {

            if (debug) {
                console.log("token ==> " + token)
            }

            if (token instanceof Number) {
                this.operands_append(token.val)         // put numbers on the operand_stack
            } else if (token instanceof MathFunc) {
                this.operator_stack.push(token)         // put functions on the operator_stack
            } else if (token instanceof UnaryMinus) {
                this.operator_stack.push(token)         // put unary minus on the operator_stack
            } else if (token instanceof UnaryPlus) {
                pass                                    // don't need to do anything with unary plus
            } else if (token instanceof BinaryOperator) {
                // if the token is a binary operator

                let new_op = token

                while (this.operator_stack.length > 0 && this.operator_stack[this.operator_stack.length - 1] instanceof BinaryOperator) {

                    let old_op = this.operator_stack[this.operator_stack.length - 1]

                    // left associative binary operands with greater or equal precedence should be evaluated first
                    //     ex: 2 + 3 + 1 --> (2 + 3) + 1
                    //     ex: 2 * 3 + 1 --> (2 * 3) + 1
                    // right associative binary operands with greater precedence should be evaluated first
                    //     ex: 2 ^ 3 ^ 4 --> 2 ^ (3 ^ 4)
                    //     ex: 2 ^ 3 * 4 --> (2 ^ 3) * 4
                    if ((new_op.associative == "left" && old_op.precedence >= new_op.precedence) ||
                        (new_op.associative == "right" && old_op.precedence > new_op.precedence)) {

                        this.operator_stack.pop()                       // pop the old op from the operator_stack

                        let right_operand = this.operand_stack.pop()    // get the right and left operands
                        let left_operand  = this.operand_stack.pop()

                        let result = old_op.func(left_operand, right_operand)

                        this.operands_append(result)                    // push the result onto the operand_stack

                    } else {
                        break
                    }
                }
                this.operator_stack.push(new_op)

            } else if (token instanceof LParen) {
                this.operator_stack.push(token)

            } else if (token instanceof RParen) {

                let op = this.operator_stack.pop()
                while (!(op instanceof LParen)) {

                    if (op instanceof BinaryOperator) {
                        if (this.operand_stack.length < 2) {
                            throw new ParseException("not enough operands for binary op: " + op.str)
                        }

                        let right_operand = this.operand_stack.pop()    // get the right and left operands
                        let left_operand  = this.operand_stack.pop()

                        let result = op.func(left_operand, right_operand)

                        this.operands_append(result)                    // push the result onto the operand_stack
                    }
                    op = this.operator_stack.pop()
                }

                if (this.operator_stack.length > 0 && this.operator_stack[this.operator_stack.length - 1] instanceof MathFunc) {
                    op = this.operator_stack.pop()
                    let operand = this.operand_stack.pop()
                    let result = op.func(operand)

                    this.operands_append(result)                    // push the result onto the operand_stack
                }

                this.apply_unary_minus()
            } else {
                console.log("unhandled token: " + token)
            }

            if (debug) {
                this.dump_stacks()
            }

            token = lex.getToken()
        }

        while (this.operator_stack.length > 0) {
            let op = this.operator_stack.pop()
            if (!(op instanceof BinaryOperator)) {
                throw new ParseException("invalid binary operator " + op.str)
            }
            if (this.operand_stack.length < 2) {
                throw new ParseException("not enough operands for binary operator")
            }
            let right_operand = this.operand_stack.pop()
            let left_operand  = this.operand_stack.pop()
            let result = op.func(left_operand, right_operand)

            this.operands_append(result)                    // push the result onto the operand_stack
        }

        return this.operand_stack.pop()
    }

    clear() {
        // TODO clear any variables created by the user
        this.operand_stack  = []
        this.operator_stack = []
    }
}

