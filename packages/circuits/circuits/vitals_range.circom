pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

/*
 * Public inputs:  low, high (e.g. BP bounds: 90, 120)
 * Private inputs: value (actual measurement), record_hash
 */
template VitalsRange() {
    signal input low;
    signal input high;
    signal input value;        // PRIVATE
    signal input record_hash;  // PRIVATE

    signal output commitment;

    component geq = GreaterEqThan(32);
    geq.in[0] <== value;
    geq.in[1] <== low;
    geq.out === 1;

    component leq = LessEqThan(32);
    leq.in[0] <== value;
    leq.in[1] <== high;
    leq.out === 1;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== record_hash;
    hasher.inputs[1] <== value;
    commitment <== hasher.out;
}

component main { public [low, high] } = VitalsRange();
