/*
 *  Self, a tokenizer, parser and compiler for JavaScript... in JavaScript
 *  Copyright 2010, David McLaughlin
 *  http://www.dmclaughlin.com
 * 
 *  Release: 0.0.5 (Statements Edition)
 */
 var self = (function() {
 
    var errors = [];
 
    var error = function(msg) {
        errors.push(msg);
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

        /*
         *  Takes a token with a value and type and returns
         *  an object parsed for use with the analyser
         */        
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
         *  Apply each syntax regular expression against the source
         *  throwing away whitespace. If no token is found, we can
         *  say there is a syntax error. 
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
            if(type === 'number' || type === 'string') {
                symbol = symbolTable['(literal)'];                                   
            } else if(type === 'name') {
                symbol = symbolTable[val] || symbolTable['(name)'];
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
         *  is formed by shifting nodes to the left or right of a child tree
         *  based on binding powers of operators, giving us operator
         *  precedence. 
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
         *  The tree can then be traversed inorder to get the 
         *  desired operator precedence. See the translator for examples.                 
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
        
        function statements() {
            var s = [];
            while(currentToken.value !== '(end)' && currentToken.value !== '}') {
                s.push(statement());
            }
            return s;
        }

        /*
         *  Parse a statement
         */
        function statement() {
            var t = currentToken;
            // if current token is a statement symbol
            if(t.std) {
                advance();
                return t.std();
            }
            var exp = expression(0);
            advance(";");
            return exp;
        }
        
        /*
         *  Define a symbol as a statement
         */
        function stmt(sym, fn) {
            var s = symbol(sym);
            s.reserved = true;
            s.std = fn;
            return s;
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
        
        function infixr(id, bp, led) {            
            var s = symbol(id, bp);
            s.led = led || function(left) {
                this.first = left;
                // this is how it differs from infix                
                this.second = expression(bp - 1); 
                this.arity = "binary";
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
                this.prefix = true;
                return this;
            };            
            return s;
        }
        
        function suffix(id, led) {
            var s = symbol(id, 90);
            s.led = led || function(left) {
                this.first = left;
                this.arity = "unary";
                this.suffix = true;
                return this;
            };
            return s;
        }
        
        /*
         *  A block is statements surrounded by braces
         */
        function block() {
            var t = currentToken;
            advance("{");
            return t.std();
        }
        
    
        /*
         *
         *
         *  STOP!...  GRAMMAR TIME
         *  Define the JavaScript grammar      
         *
         *
         *  @idea - seperate this grammar into another
         *          module.. which simply returns
         *          a symbol table for the analyser. 
         *          Can make it extensible too.. 
         *
         */                
        var reservedWords = [
            'var','if','else','for','while','switch',
            'do','case','try','catch','finally','break',
            'default', 'throw'
        ];         
        function keywords(words) {
            for(var i = 0, j = words.length; i < j; i++) {
                var s = symbol(words[i]);
                s.reserved = true;
                s.nud = function() { return this; };
            }
        }         
        keywords(reservedWords);        
        
         
        symbol('(literal)').nud = function() { return this; };
        symbol('(name)').nud = function() { return this; };        
        
        // expression delimiters
        function delim(delims) {
            for(var i = 0, j = delims.length; i < j; i++) {
                symbol(delims[i]);
            }
        }
        delim([';',':',')','}',',','(end)']);

        // reserved variables/keywords
        reserved('Infinity');
        reserved('NaN');
        
        // logical operators
        infixr('||', 30);
        infixr('&&', 30);  
        
        // bitwise operators
        function bitwise(ops) {
            for(var i = 0, j = ops.length; i < j; i++) {
                infix(ops[i], 30);
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
        
        // suffix
        prefix('++');
        suffix('++');
        suffix('--');
        
        /*
         *  Comma operator can pretty much replace
         *  a semi-colon...
         */
        infix(',', 200, function(left) {
            this.first = left;
            this.second = expression(200);
            this.arity = "comma";
            return this;
        });
        
        // prefix operators
        prefix('-');
        prefix('~');
        prefix('(', function() {
            var e = expression(0);
            advance(")");
            e.parens = true;
            return e;
        });
        
        // assignment operators
        function assignment(id) {
            return infixr(id, 10, function(left) {           
                if (left.id !== ',' && left.id !== '.' && left.id !== "[" && left.arity !== "name") {
                    error("Bad left value on assignment: " + left.arity);
                }
                this.first = left;
                this.second = expression(9);
                this.arity = "binary";
                return this;
            });        
        }   
        var assignops = ['=','+=','-=','/=','*=','&=','^=','|=','<<=','>>=','>>>='];
        for(var i = 0, j = assignops.length; i < j; i++) {
            assignment(assignops[i]);
        }
                
        // statements
        // variables
        stmt("var", function() {         
            var vars = expression(0);
            // Support:
            // var x;
            // var x = 10;
            // var x,y,z;
            // var x = 10, y = 20, z;            
            if(vars.arity !== 'binary' && vars.arity !== 'name' && vars.arity !== 'comma') {
                error("Bad token type after var declaration: " + vars.arity);
            }            
            advance(';');
            return { arity: "variable", first : vars };
        });
        
        // blocks
        stmt("{", function () {
            var a = statements();
            advance("}");
            return a;
        });
        
        // if statement
        stmt("if", function() {
            advance("(");
            this.first = expression(0);
            advance(")");            
            this.second = block();   
            // check for else if...
            if(currentToken.id === "else") {
                advance("else");
                this.third = currentToken.id === "if" ? statement() : block();
            }       
            this.arity = "statement";
            return this;        
        });
        
        // while statement
        stmt("while", function() {
            advance("(");
            this.first = expression(0);
            advance(")");
            this.second = block();
            this.arity = "statement";
            return this;            
        });
        
        // for statement
        stmt("for", function() {
            advance("(");            
            if(currentToken.value !== ';') {            
                this.first = statement();
            } else {
                advance(";");
            }
            if(currentToken.value !== ';') {            
                this.second = expression(0);
            } 
            advance(";");
            if(currentToken.value !== ')') {                       
                this.third = expression(0);
            }
            advance(")");
            this.fourth = block();
            this.arity = "forstatement";
            return this;
        });
        
        // do statement
        stmt("do", function() {
            this.first = block();
            advance("while");
            advance("(");
            this.second = expression(0);
            advance(")");
            advance(";");            
            this.arity = "dostatement";
            return this;        
        });
        
        stmt("try", function() {
            this.first = block();
            advance("catch");
            advance("(");
            if(currentToken.arity !== 'name') {
                error("Expected name in catch statement, found: " + currentToken.arity);
            }
            this.second = currentToken;
            advance();
            advance(")");
            this.third = block();
            if(currentToken.id === 'finally') {
                advance("finally");
                this.fourth = block();
            }            
            this.arity = "trystatement";
            return this;        
        });
        
        stmt("switch", function() {
            var cases = [], curCase, caseStatements;            
            advance("(");
            this.first = expression(0);
            advance(")");
            advance("{");
            // get the case clauses
            for(;;) {
                curCase = {}, caseStatements = []; // clean out
                if(currentToken.id !== 'case' && currentToken.id !== 'default') {
                    error("Invalid switch statement, expected case or default and found: " + currentToken.value);
                    break;
                }
                
                if(currentToken.id === 'default') {
                    curCase.isDefault = true;
                    advance('default');
                    advance(':');
                } else {
                    advance('case');                
                    curCase.first = expression(0);
                    advance(":");
                }
                
                while(currentToken.id !== 'case' && currentToken.id !== '}' && currentToken.id !== 'default') {
                    caseStatements.push(statement());                    
                }
                curCase.second = caseStatements;
                cases.push(curCase);
                if(currentToken.id === '}') {
                    break;
                }                
            }            
            this.second = cases;
            this.arity = "switchstatement";
            advance('}');
            return this;            
        });
        
        stmt('throw', function() {
            var block = false; 
            this.first = expression(0);            
            if(currentToken.value === ';') {
                advance(';');
            }       
            this.arity = "throwstatement";
            // doesn't have to be.. can throw a function or other block stuff
            return this;                    
        });

        /*
         *  Takes an array of tokens and builds a parse
         *  tree from them
         */
        return function(tokenArr) {
		    // reset state
            currentToken = null;
            tokenPointer = 0;
            tokens = [];   
            errors = []; // TODO - this state stuff sucks, refactor
 
            tokens = tokenArr;
            advance();
            // create a parse tree from a statement
            var tree = statements();
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
        
        /*
         *  Evaluate the node and pass it to the
         *  corresponding output function        
         *
         *  Maybe refactor this into a hash lookup..
         */
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
                case 'variable':
                    return variable(node);
                case 'comma':
                    return comma(node);
                case 'statement':
                    return statement(node);
                case 'forstatement':
                    return forstatement(node);
                case 'dostatement':
                    return dostatement(node);                    
                case 'trystatement':
                    return trystatement(node);                           
                case 'switchstatement':
                    return switchstatement(node);   
                case 'throwstatement':
                    return throwstatement(node);                       
                default:
                    error("Unknown node type: " + node.arity);
            }
        }
        
        /*
         *  Takes an array of statements and evaluates
         */
        function statements(sarr) {
            var s = [];
            for(var i = 0, j = sarr.length; i < j; i++) {
                var statement = evalNode(sarr[i]);
                if(statement.block) {
                    statement = statement.str;
                } else {
                    statement += ';';
                }
                s.push(statement);
            }            
            return s.join("\n");
        }
        
        function statement(node) {
            var str = node.id;
            str += '(' + evalNode(node.first) + ') {\n';
            str += statements(node.second) + '\n';
            str += '}\n';
            
            // else, else if node
            if(node.third) {
                if(node.third.id === 'if') {
                    var block = evalNode(node.third);
                    str += 'else ' + block.str;
                } else {
                    str += 'else { \n' + statements(node.third) + '\n}';   
                }
            }
            return { str: str, block: true };
        }        
        
        function dostatement(node) {
            var str = node.id + '{\n';
            str += statements(node.first) + '\n';
            str += '} while(' + evalNode(node.second) + ')';            
            return str;
        }

        function forstatement(node) {
            var str = node.id + '(';                 
            str += (node.first ? evalNode(node.first) : '') + ';';
            str += (node.second ? evalNode(node.second) : '') + ';';
            str += (node.third ? evalNode(node.third) : '');
            str += ') {\n';
            str += statements(node.fourth);
            str += '\n}\n';
            return { str: str, block: true};                    
        }
        
        function trystatement(node) {
            var str = node.id + '{\n';
            str += statements(node.first) + '\n';
            str += '} catch(' + evalNode(node.second) + ') { \n';
            str += statements(node.third) + '\n';
            if(node.fourth) {
                str += '} finally {\n';
                str += statements(node.fourth);
                str += '}\n';
            } else {
                str += '}\n';
            }
            return {str: str, block: true};        
        }
        
        function switchstatement(node) {
            var clauses = node.second;
            var str = node.id + '(' + evalNode(node.first) + ') {\n';
            // for each clause
            for(var i = 0, j = clauses.length; i < j; i++) {
                if(clauses[i].isDefault) {
                    str += 'default:\n';
                } else {
                    str += 'case ' + evalNode(clauses[i].first) + ':\n';
                }
                if(clauses[i].second) {
                    str += statements(clauses[i].second);
                }
                str += '\n';
            }
            str += '}';
            return {str: str, block: true};
        }
        
        function throwstatement(node) {
            var str = node.id + ' ' + evalNode(node.first);
            return str;         
        }
        
        function comma(node) {
            var str = evalNode(node.first);
            str += ', ';
            if(node.second) {
                str += evalNode(node.second); 
            }
            return str;
        }
        
        function variable(node) { 
            return "var " + evalNode(node.first);
        }

        function unary(node) {
            var str;
            if(node.suffix) {
                str = evalNode(node.first) + node.value;
            } else {
                str = node.value + evalNode(node.first);
            }         
            return str;
        }

        function binary(node) {
            var str = evalNode(node.first);
            str += node.value;
            str += evalNode(node.second);                              
            
            if(node.parens) {
                return '(' + str + ')';
            } else {
                return str;
            }
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
            var s, output = [];
            if(!isArray(tree)) {
                s = [tree];
            } else {
                s = tree;
            }            
            return statements(s);
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
                var start = new Date().getTime();
                var tokens = tokenize(source);
                var tree   = analyse(tokens);
                var output = translate(tree);
                this.executeTime = new Date().getTime() - start;
                if(errors.length > 0) {
                    return errors;
                }
                return output; 
            }
        }
    };   
 
 })();