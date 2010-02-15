/*
 *  Self, a tokenizer, parser and compiler for JavaScript... in JavaScript
 *  Copyright 2010, David McLaughlin
 *  http://www.dmclaughlin.com
 * 
 *  Release: 0.0.2 (Strings Edition)
 */
 var self = (function() {
 
    var error = function(msg) {
        throw new Error(msg);
    };
    
    /*
     *  tokenize
     *
     *  Converts a string of JavaScript source code into
     *  individual tokens. Each token has a value, type
     *  and optional extra metadata for compilation
     *
     *  Available token types are name, string, number and operator
     */
    var tokenize = (function() {
        
        var regexes = {
            whitespace: /^\s+/,        
            name:       /^([a-zA-Z$_][a-zA-Z0-9_$]*)/,        
            number:     /^([0-9]+([xX][0-9a-fA-F]+|\.[0-9]*)?([eE][+\-]?[0-9]+)?)/, 
            operator:   /^([;:()\[\]{},]|\+[\+=]?|-[\-=]?|\*[\*=]?|\/[\/=]?|%=?|==?=?|!=?=?|>>?>?=?|<<?=?|\|\||&&|\.|&=?|\^=?|\|=?|~=?)/,
            string:     /^(""|"(.*?)([^\\]|\\\\)"|''|'(.*?)([^\\]|\\\\)')/
        };                

        function parseToken(token) {
            var parsed, val = token.value, type = token.type;            
            if (type === 'string') {
                var c = val.charAt(0);
                var quoteType = (c === "'") ? "single" : "double";
                var str = val.slice(1,-1);
                parsed = { type: type, value: str, quoted: quoteType };
            } else if (type === 'operator' || type === 'name' || type === 'number') {
                parsed = { type: type, value: val };
            } else {
                error("No token parse rule for token type: " + type);                
            }            
            return parsed;
        }
        
        /*
         *  Apply each regex to the source
         */
        function token(source) {
            // try each regex against the source
            for(var regex in regexes) {
                if(regexes.hasOwnProperty(regex)) {
                    var result = regexes[regex].exec(source);
                    if(result && regex !== 'whitespace') {
                        // strip the found token from the source
                        source = source.slice(result[0].length);
                        return { 
                            source: source, 
                            token: parseToken({value: result[0], type: regex})
                        };
                    } else if(result && regex === 'whitespace') {
                        source = source.slice(result[0].length);
                        return token(source);
                    }                 
                } 
            }
            return null;
        }
        
        function createTokens (source) {
            var tokens = [], result;
            while(source) {
                result = token(source); 
                if(result && result.token) {
                    source = result.source;
                    tokens.push(result.token);
                } else {
                    error("ILLEGAL TOKEN: " + source);
                    break;
                }
            }
            return tokens;
        }
        
        /*
         * Takes source code, splits into raw tokens and
         * parses each token with information about the content
         */
        return function(source) {
            return createTokens(source);  
        };
    })(); 
 
    /* 
     *  Lexer for lexical analysis
     *
     *  A Pratt Parser, as described by Douglas Crockford:
     *  http://javascript.crockford.com/tdop/tdop.html
     *
     *  Converts an array of tokens into a parse tree  
     */
    var analyse = (function() {
    
        var symbolTable = {};
        var currentToken;
        var tokenPointer = 0;
        var tokens = [];   

        // object used as the prototype for new symbol classes
        var baseSymbol = {
            /* called when the symbol is at the start of an expression */
            nud: function() {
                error(this.id + " is not defined as a prefix.");
            },
            /* called when the symbol is inside the expression */
            led: function(left) {
                error(this.id + " is not defined as an infix(r).");
            },
            /* called when the symbol is a statement */
            std: null
        };

        /* 
         *  Define a new symbol
         */
        function symbol(id, lbp) {
            var sym = symbolTable[id];
            lbp = lbp || 0;
            
            // if our symbol is already define
            if(sym) {
                if(lbp > sym.lbp) {
                    sym.lbp = lbp;
                }
            } else {
                // create a new symbol object from the baseSymbol
                var cla = function () { };
                cla.prototype = baseSymbol;                
                sym = new cla();
                
                sym.id = sym.value = id;
                sym.lbp = lbp;
                symbolTable[id] = sym;
            }
            return sym;
        }
        
        /*
         *  Reserve a special JavaScript variable or keyword        
         */
        function reserved(id) {
            var s = symbol(id, 0);
            s.nud = function() { return this; }
            return s;
        }
                
        /*
         *  Peek at the next raw token. 
         *
         *  Used to make syntax analysis about JavaScript niceties such as:
         *
         *     >>> (5 + + + + - + + + - 5 === 10);
         *     true
         *         
         *  (go ahead, check it...)
         */
        function peek(tokenAt) {
            var peekIndex, rawToken;
            peekIndex = tokenAt || tokenPointer;
            if(peekIndex > tokens.length) {
                return symbolTable['(end)'];
            }            
            return tokens[peekIndex];            
        }        
            
        /*
         *  Get the next token, and turn it into a symbol
         */
        function advance(expected) {
            var rawToken, val, type, symbol, obj, strType;
            
            // throw an error if we didn't get the token we expected
            if(expected && expected !== currentToken.id) {
                error("Expected " + expected + ", found " + currentToken.id);
            }
            
            // if no more tokens, return the (end) symbol
            if(tokenPointer >= tokens.length) {
                currentToken = symbolTable['(end)'];
                return currentToken;
            }
            
            // fetch the next raw token
            rawToken = tokens[tokenPointer];
            tokenPointer += 1;
            
            // get the symbol from the symbol table
            // based on the raw token type
            val  = rawToken.value;
            type = rawToken.type            
            strType = rawToken.quoted || null;
            
            // number
            if(type === 'number') {
                symbol = symbolTable['(literal)'];                
            } else if(type == 'string') {
                symbol = symbolTable['(literal)'];                
            } else if(type === 'name') {
                symbol = symbolTable[val];
            }
            else if (type === 'operator') {                 
                // sort out the repeated plus/minus problem here
                // 5 + + + + 5 === 10; (true)
                // 5 - - 5 === 10; (true)
                // 5 + - + - + 5 === 10; (true)
                // 15 - - - 5 === 10; (true)
                if(val === '+' || val === '-') {
                    var currentSign = val;
                    var nextIndex = tokenPointer;                    
                    // loop till we stop hitting operators
                    while(true) {
                        // peek at the next token 
                        var nextToken = peek(nextIndex);
                        // if we have another operator we need to check if its valid
                        if(nextToken.type === 'operator') {
                            // only plus and minus can be repeated, parenthesis are also an exception
                            if(nextToken.value !== '+' && nextToken.value !== '-' && nextToken.value !== '(') {
                                error("Invalid operator sequence:" + val + " " + nextToken.value);
                                break;
                            } else if(nextToken.value === '+' || nextToken.value === '-') {
                                // update the current sign, effectively discarding this repeated 
                                // operator from the parse tree. Any negative cancels out all
                                // plus operators. Negatives can negate themselves, turning positive.
                                if(nextToken.value === '+') {
                                    currentSign = (currentSign === '-') ? '-' : '+';
                                } else if(nextToken.value === '-') {
                                    currentSign = (currentSign === '-') ? '+' : '-';
                                }
                                nextIndex += 1;                                
                            } else {
                                break; //parenthesis is a special case.. syntax mistakes will be caught later
                            }
                        } else {
                            break;
                        }
                    }
                    val = currentSign; 
                    tokenPointer = nextIndex;
                }
                
                symbol = symbolTable[val];
                if(!symbol) {
                    error("Unknown operator: " + val);
                }
            }
            else {
                error("Unknown token type: " + token.type);
            }            
            
            // create a new dynamic class which inherits from our symbol
            // and set currentToken to an instance of it
            obj = function () { };
            obj.prototype = symbol;                        
            currentToken = new obj();
            currentToken.value = val;
            currentToken.arity = type;
            currentToken.strType = strType;
            
            return currentToken;            
        }
        
        /*
         *  Parse an expression
         *
         *  This is the Pratt Parser technique. The expression tree
         *  is formed by shifting nodes to the left based on binding powers -
         *  each infix symbol is given its own binding power when 
         *  grammar is defined and it's own led function. 
         *           
         *  For example, if this is called by statement() like so:
         *
         *       expression(0); 
         *
         *  And the next statement is:
         *
         *        1 + 2 * 3 + 4 - 5;
         *
         *  Then the parse tree looks like this:
         *
         *                 -
         *                / \
         *               +   5
         *              / \
         *             +   4
         *            / \
         *           1   *
         *              / \
         *             2   3    
         *
         *
         *  So if we were writing a LISP compiler,
         * 
         */
        function expression(rbp) {
            var left, t = currentToken;
            advance();
            // get the null denotation value of the last node
            left = t.nud();
            // if the bounding power is lower than the bounding power
            // of the last node, we continue to build the child nodes            
            while(rbp < currentToken.lbp) {
                t = currentToken;
                advance();
                left = t.led(left);
            }
            return left;            
        }       

        /*
         *  Parse a statement
         */
        function statement() {
            var exp = expression(0);
            advance(";");
            return exp;
        }
        
        /*
         *  Add an infix operator (one which appears inside the expression)       
         */
        function infix(id, bp, led) {
            var s = symbol(id, bp);           
            s.led = led || function(left) {
                // set up my child nodes, the param node is my left child                
                this.first  = left;
                // the rest of the expression is my right node...
                this.second = expression(bp);
                this.arity  = "binary";
                return this;                
            };
            return s;
        }
        
        /*
         *  Add a prefix operator (one which applies only to the right-most symbol)
         */
        function prefix(id, nud) {
            var s = symbol(id);
            s.nud = nud || function() {
                this.first = expression(70);
                this.arity = "unary";
                return this;
            };            
            return s;
        }
    
        /*     Stop! GRAMMAR TIME        */        
        symbol('(literal)').nud = function() { return this; };
        
        // expression delimiters
        function delim(delims) {
            for(var i = 0, j = delims.length; i < j; i++) {
                symbol(delims[i]);
            }
        }
        delim([';',')','(end)']);

        // reserved variables/keywords
        reserved('Infinity');
        reserved('NaN');
        
        // logical operators
        infix('||', 30);
        infix('&&', 30);  
        
        // bitwise operators
        function bitwise(ops) {
            for(var i = 0, j = ops.length; i < j; i++) {
                infix(ops[i], 30);
                infix(ops[i] + '=', 30);
            }
        }        
        bitwise(['&','^','|','<<','>>','>>>']);               

        // equality operators
        function equality(ops) {
            for(var i = 0, j = ops.length; i < j; i++) {
                infix(ops[i], 40);
                infix(ops[i] + '=', 40);
            }
        }        
        equality(['==','!=','<','>']);
     
        // math operators
        infix('+', 50);
        infix('-', 50);
        infix('*', 60);
        infix('/', 60);
        infix('%', 60);
        
        prefix('-');
        prefix('~');
        prefix('(', function() {
            var e = expression(0);
            advance(")");
            return e;
        });

        return function(tokenStream) {
		    // reset state
            currentToken = null;
            tokenPointer = 0;
            tokens = [];   
 
            tokens = tokenStream;
            advance();
            // create a parse tree from a statement
            var tree = statement();
            advance("(end)");
            return tree; 
        };
    })();

    /*
     *  translate
     *
     *  Takes a parse tree and turns it into code
     */    
    var translate = (function() {
    
        function isArray(obj) {
            return obj.constructor == Array;
        }     
        
        function evalNode(node) {            
            switch(node.arity) {
                case 'binary':
                    return binary(node);
                case 'unary':
                    return unary(node);
                case 'number':
                    return number(node);
                case 'string':
                    return string(node);
                case 'name':
                    return name(node);
                error("Unknown node type: " + node.arity);
            }
        }

        function unary(node) {
            var str = node.value;                       
            str += evalNode(node.first);            
            return str;
        }

        function binary(node) {
            var str = '(';            
            str += evalNode(node.first);
            str += node.value;
            str += evalNode(node.second);                  
            return str + ')';
        }
        
        function number(node) {
            return node.value;
        }
        
        function string(node) {      
            var q = (node.strType === 'double') ? '"' : "'";
            return q + node.value + q;
        }
        
        function name(node) {
            return node.value;
        }
    
        return function(tree) {
            var statements, output = [];
            if(!isArray(tree)) {
                statements = [tree];
            } else {
                statements = tree;
            }
            
            for(var i = 0; i < statements.length; i++) {                
                var node = statements[i], str;         
                str = evalNode(node);                
                output.push(str + ";");
            }
            return output.join("\n");
        };    
    })(); 

    /*
     *  Make each component public
     *
     *  var tokens = self.tokenize(source);
     *  var tree   = self.analyse(tokens);
     *  var output = translate(tree);
     *  return output;
     */
    return {
        analyse: analyse,
        tokenize: tokenize,
        translate: translate,
        compile: function(source) {
            if(source) {
                var tokens = tokenize(source);
                var tree   = analyse(tokens);
                var output = translate(tree);                                
                return output; 
            }
        }
    };   
 
 })();