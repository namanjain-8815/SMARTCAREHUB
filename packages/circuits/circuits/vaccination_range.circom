pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

/*
 * Public inputs:  today_timestamp (days), window_days
 * Private inputs: vacc_date (days since epoch), record_hash
 * Proves: today_timestamp - window_days <= vacc_date <= today_timestamp
 */
template VaccinationRange() {
    signal input today_timestamp;
    signal input window_days;
    signal input vacc_date;      // PRIVATE
    signal input record_hash;    // PRIVATE — binding commitment

    signal output commitment;

    component geq = GreaterEqThan(64);
    geq.in[0] <== vacc_date;
    geq.in[1] <== today_timestamp - window_days;
    geq.out === 1;

    component leq = LessEqThan(64);
    leq.in[0] <== vacc_date;
    leq.in[1] <== today_timestamp;
    leq.out === 1;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== record_hash;
    hasher.inputs[1] <== vacc_date;
    commitment <== hasher.out;
}

component main { public [today_timestamp, window_days] } = VaccinationRange();
