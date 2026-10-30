pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

/*
 * Public inputs:  today_ts (days), min_age_days
 * Private inputs: dob_ts (days since epoch), record_hash
 */
template AgeThreshold() {
    signal input today_ts;
    signal input min_age_days;
    signal input dob_ts;        // PRIVATE
    signal input record_hash;   // PRIVATE

    signal output commitment;

    signal age;
    age <== today_ts - dob_ts;

    component geq = GreaterEqThan(64);
    geq.in[0] <== age;
    geq.in[1] <== min_age_days;
    geq.out === 1;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== record_hash;
    hasher.inputs[1] <== dob_ts;
    commitment <== hasher.out;
}

component main { public [today_ts, min_age_days] } = AgeThreshold();
