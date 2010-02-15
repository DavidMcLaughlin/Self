function testSingleExpression() {
    assertEquals(5, compileAndRun("5;"));
}

function testBasicAddition() {
    assertEquals(5 + 10, compileAndRun("5 + 10;"));
    assertEquals(10 + 10, compileAndRun("10+10;"));
}	

function testMultipleAddition() {
    assertEquals(1+2 + 3 + 4+5, compileAndRun("1+2 + 3 + 4+5;"));	
}

function testMultipleSubstraction() {
    assertEquals(5-4-3-2 - 1, compileAndRun("5-4-3-2 - 1;"));
}

function testBasicSubtraction() {
    assertEquals(100 - 1, compileAndRun("100 - 1;"));
    assertEquals(50-40, compileAndRun("50-40;")); 
}

function testBasicMultiplication() {
    assertEquals(10 * 100, compileAndRun("10 * 100;"));
    assertEquals(999999 * 0, compileAndRun("999999*0;"));
}

function testBasicDivision() {
    assertEquals(100 / 10, compileAndRun("100 / 10;"));
    assertEquals(10/10, compileAndRun("10/10;"));
}    

function testParenthesis() {
    assertEquals((50 + 10) * 2 , compileAndRun("(50 + 10) * 2;"));
    assertEquals(1-(10/10), compileAndRun("1-(10/10);"));
    assertEquals((10 - (1 + 15) * 8), compileAndRun("(10 - (1 + 15) * 8);"));
}

function testModulo() {
    assertEquals(30 % 20, compileAndRun("30 % 20;"));
}

function testEquality() {
    assertEquals(20 == 20, compileAndRun("20 == 20;"));
    assertEquals(0 == 1, compileAndRun("0 == 1;"));
    assertEquals(10 === 1, compileAndRun("10 === 1;"));
    assertEquals(1 === 1, compileAndRun("1 === 1;"));
}

function testInequality() {
    assertEquals(20 != 10, compileAndRun("20 != 10;"));
    assertEquals(10 !== 5, compileAndRun("10 !== 5;"));
    assertEquals(10 != 10, compileAndRun("10 != 10;"));
    assertEquals(1 !== 1, compileAndRun("1 !== 1;"));
}

function testLessThan() {
    assertEquals(50 < 10 , compileAndRun("50 < 10;"));
    assertEquals(50 <= 50, compileAndRun("50 <= 50;"));
}    

function testGreaterThan() {
    assertEquals(20 > 10, compileAndRun("20 > 10;"));
    assertEquals(10 >= 20, compileAndRun("10 >= 20;"));
}

function testLogicalOr() {
    assertEquals(0 || 10, compileAndRun("0 || 10;"));
    assertEquals(0 || 0, compileAndRun("0||0;"));
}

function testLogicalAnd() {
    assertEquals(1 && 2, compileAndRun("1&&2;"));
    assertEquals(10 && 0, compileAndRun("10 && 0;"));
}

function testNegativeNumbers() {
    assertEquals(-5, compileAndRun("-5;"));
    assertEquals(10 + -11, compileAndRun("10 + -11;"));
}

function testRepeatedOperators() {
    assertEquals(5 + + + + + + + + 5, compileAndRun("5 + + + + + + + + 5;"));   
    assertEquals(10 + - + 100, compileAndRun("10 + - + 100;"));
    assertEquals(10 + + + - + + + + + - 1, compileAndRun("10 + + + - + + + + + - 1;"));
    assertEquals(10 - - 5, compileAndRun("10 - - 5;"));        
    assertEquals(10 - - - 5, compileAndRun("10 - - - 5;"));        
}

function testDecimals() {
    assertEquals(1.2, compileAndRun("1.2;"));
    assertEquals(1., compileAndRun("1.;"));
}

function testExponent() {
    assert(compileAndRun("2e2 === 200;"));
    assert(compileAndRun("2.e2 === 200;"));
    assert(compileAndRun("3.14e2 === 314;"));
    assert(compileAndRun("1.2e+2 === 120;"));
    assert(compileAndRun("100e-2 === 1;"));
    assert(compileAndRun("100.1e-1 === 10.01;"));
}
function testOctals() {
    assert(compileAndRun("0220 === 144;"));
    assert(compileAndRun("0220 * 10 === 1440;"));
    assert(compileAndRun("09 === 9;"));
}

function testHexadecimals() {
    assert(compileAndRun("0x2404 === 9220;"));
    assert(compileAndRun("0x2404 - 1 === 9219;"));
    assert(compileAndRun("0xabcdef12345 === 11806310474565;"));
}

function testInfinity() {
    assert(compileAndRun("5/0 === Infinity;"));
}

function testBitwise() {
    // &, |, ^, ~, <<, >>, >>>
    assertEquals(1 & 1, compileAndRun("1 & 1;"));
    assertEquals(0&1, compileAndRun("0&1;"));
    assertEquals(1 ^ 0, compileAndRun("1 ^ 0;"));
    assertEquals(1 ^ 1, compileAndRun("1 ^ 1;"));
    assertEquals(0 | 0, compileAndRun("0 | 0;"));
    assertEquals(1 | 0, compileAndRun("1 | 0;"));
    assertEquals(~0, compileAndRun("~0;"));
    assertEquals(~1, compileAndRun("~1;"));
    assertEquals(1 <<2, compileAndRun("1 <<2;"));
    assertEquals(4>>2, compileAndRun("4>>2;"));
    assertEquals(4>>>2, compileAndRun("4>>>2;"));
    // &=, |=, ^=, <<=, >>=, >>>=    
}

function testMixedOperators() {    
    assertEquals(50 + 10 * 2, compileAndRun("50 + 10 * 2;"));
    assertEquals(1-10/10, compileAndRun("1-10/10;"));
    assertEquals(10 - 1 + 15 * 8, compileAndRun("10 - 1 + 15 * 8;"));
}        

function testAcid() {
    assertEquals((80*100-10+(100-30)/(10+10-10)+5-6*100), compileAndRun("(80*100-10+(100-30)/(10+10-10)+5-6*100);"));
    assertEquals(10 + 20 - 5 * 4 / 1 % 8 * 1 ^ 0, compileAndRun("10 + 20 - 5 * 4 / 1 % 8 * 1 ^ 0;"));
    assertEquals((10 + 20 - 5 * 4 / 1 % 8 * 1 ^ 0) <= 1 || 50.5e1 && 1.e1, compileAndRun("(10 + 20 - 5 * 4 / 1 % 8 * 1 ^ 0) <= 1 || 50.5e1 && 1.e1;"));  
}