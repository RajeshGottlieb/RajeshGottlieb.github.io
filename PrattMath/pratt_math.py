#!/usr/bin/env python3
import argparse
import re

# https://abarker.github.io/typped/pratt_parsing_intro.html

class TokenBase:
    '''Token base class'''
    def __init__(self, precedence):
        self.precedence = precedence
    def head_handler(self, lex):
        raise NotImplementedError('head_handler not implemented')
    def tail_handler(self, lex, left):
        raise NotImplementedError('head_handler not implemented')
    def eval(self):
        raise NotImplementedError('eval not implemented')
    def s_expr(self):
        raise NotImplementedError('eval not implemented')
    def prec(self):
        return self.precedence

class End(TokenBase):
    '''Token for End of expression'''
    def __init__(self):
        super().__init__(0)

class Token(TokenBase):
    '''Token base class'''
    def __init__(self, precedence, string):
        super().__init__(precedence)
        self.string = string

class Number(Token):
    '''Token for a literal number'''
    def __init__(self, string, val):
        super().__init__(0, string)
        self.val = val
        print("Number prec={} val={}".format(self.prec(), self.val))
    def head_handler(self, lex):
        return self
    def s_expr(self):
        return self.val
    def eval(self):
        return self.val

class BinaryOperator(Token):
    def __init__(self, precedence, string):
        super().__init__(precedence, string)
        self.left_child = None
        self.right_child = None
    def tail_handler(self, lex, left):
        self.append_children(left, recursive_parse(lex, self.prec()))
        return self
    def append_children(self, left_child, right_child):
        self.left_child = left_child
        self.right_child = right_child

class Add(BinaryOperator):
    '''Token for binary + operator'''
    def __init__(self):
        super().__init__(30, "+")
        print("Add prec={}".format(self.prec()))
    def s_expr(self):
        return "(+ {} {})".format(self.left_child.s_expr(), self.right_child.s_expr())
    def eval(self):
        return self.left_child.eval() + self.right_child.eval()

class Subtract(BinaryOperator):
    '''Token for binary - operator'''
    def __init__(self):
        super().__init__(30, "-")
        print("Subtract prec={}".format(self.prec()))
    def s_expr(self):
        return "(- {} {})".format(self.left_child.s_expr(), self.right_child.s_expr())
    def eval(self):
        return self.left_child.eval() - self.right_child.eval()

class Multiply(BinaryOperator):
    '''Token for binary * operator'''
    def __init__(self):
        super().__init__(40, "*")
        print("Multiply prec={}".format(self.prec()))
    def s_expr(self):
        return "(* {} {})".format(self.left_child.s_expr(), self.right_child.s_expr())
    def eval(self):
        return self.left_child.eval() * self.right_child.eval()

class Divide(BinaryOperator):
    '''Token for binary / operator'''
    def __init__(self):
        super().__init__(40, "/")
        print("Divide prec={}".format(self.prec()))
    def s_expr(self):
        return "(/ {} {})".format(self.left_child.s_expr(), self.right_child.s_expr())
    def eval(self):
        return self.left_child.eval() / self.right_child.eval()

#   class UnaryMinus(TokenNode):
#       '''Token for unary minus operator'''
#       def __init__(self, string):
#           super().__init__(100, "-")
#       def eval(self):
#           return 0 - self.right_child.eval()

class Pow(BinaryOperator):
    '''Token for binary ^ operator'''
    def __init__(self):
        super().__init__(50, "^")
        print("Pow prec={}".format(self.prec()))
    def tail_handler(self, lex, left):
        self.append_children(left, recursive_parse(lex, self.prec() - 1))
        return self
    def s_expr(self):
        return "(pow {} {})".format(self.left_child.s_expr(), self.right_child.s_expr())
    def eval(self):
        return self.left_child.eval() ** self.right_child.eval()

class Regex(object):
    '''regular expression helper object'''
    def __init__(self, regex):
        self.re = re.compile(regex)
        self.m = None
    def match(self, s):
        self.m = self.re.match(s)
        return self.m
    def search(self, s):
        self.m = self.re.search(s)
        return self.m
    def group(self, n):
        return self.m.group(n)

class LexError(Exception):
    def __init__(self, message):
        super().__init__(message)

class Lexer:

    def __init__(self, expr):
        self.expr = expr
        self.i = 0
        self.token = None
    #   self.decimal_regex = Regex(r'[+-]?[0-9]+')
        self.decimal_regex = Regex(r'[0-9]+')

    def getToken(self):
        '''return the next token and the new parsing offset'''
        i = self.i

        # skip over white space
        while i < len(self.expr) and self.expr[i] in '\t ':
            i += 1

        if i >= len(self.expr):
            return End(), i

        sub_expr = self.expr[i:]

        if self.decimal_regex.match(sub_expr):
            string = self.decimal_regex.group(0)
            return Number(string, int(string)), i + len(string)
        elif sub_expr.startswith("+"):
            return Add(), i + 1
        elif sub_expr.startswith("-"):
            return Subtract(), i + 1
        elif sub_expr.startswith("*"):
            return Multiply(), i + 1
        elif sub_expr.startswith("/"):
            return Divide(), i + 1
        elif sub_expr.startswith("^"):
            return Pow(), i + 1
            
        raise LexError("unexpected input: {}".format(sub_expr))

    def next(self):
        '''consume and return next token'''
        self.token, self.i = self.getToken()
        return self.token

    def peek(self):
        '''return next token without consuming it'''
        token, i = self.getToken()
        return token


def recursive_parse(lex, subexp_prec):
    curr_token = lex.next()
    processed_left = curr_token.head_handler(lex)

    while lex.peek().prec() > subexp_prec:
        curr_token = lex.next()
        processed_left = curr_token.tail_handler(lex, processed_left)

    return processed_left

def parse(lex):
    parse_tree = recursive_parse(lex, 0)
    return parse_tree


def main(args):
    print("expression='{}'".format(args.expression))
    lex = Lexer(args.expression)
    parse_tree = parse(lex)
    if args.s_expr:
        print("{}".format(parse_tree.s_expr()))
    else:
        print("{}".format(parse_tree.eval()))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Parse/evaluate mathematical expression')
    parser.add_argument('--verbose', help='verbose output', action='store_true')
    parser.add_argument('--s-expr', help='output s-expression for parse tree', action='store_true')
    parser.add_argument('expression', help='math expression')

    args = parser.parse_args()
#   print(args)

    main(args)

