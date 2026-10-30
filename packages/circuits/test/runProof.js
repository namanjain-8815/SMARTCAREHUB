const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');
const assert = require('assert');

async function testCircuits() {
  console.log('Testing ZK Groth16 Proof generation and verification...\n');

  // 1. Vaccination Range Test
  {
    console.log('-> Testing vaccination_range proof...');
    const wasmPath = path.resolve(__dirname, '../build/vaccination_range/vaccination_range_js/vaccination_range.wasm');
    const zkeyPath = path.resolve(__dirname, '../build/vaccination_range/vaccination_range_final.zkey');
    const vkey = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../build/vaccination_range/verification_key.json'), 'utf8'));

    // today = day 1000, window = 30 days. Vaccinated on day 980 (20 days ago -> valid)
    const validInputs = {
      today_timestamp: 1000,
      window_days: 30,
      vacc_date: 980,
      record_hash: 123456789,
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(validInputs, wasmPath, zkeyPath);
    const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    assert.strictEqual(verified, true, 'Valid vaccination proof must verify successfully');
    console.log('   ✓ Valid vaccination proof verified successfully!');

    // Invalid test: Vaccinated on day 900 (100 days ago, window is 30 days -> must fail constraint)
    const invalidInputs = {
      today_timestamp: 1000,
      window_days: 30,
      vacc_date: 900,
      record_hash: 123456789,
    };

    let failed = false;
    try {
      await snarkjs.groth16.fullProve(invalidInputs, wasmPath, zkeyPath);
    } catch (err) {
      failed = true;
    }
    assert.strictEqual(failed, true, 'Expired vaccination date must fail constraint check');
    console.log('   ✓ Expired vaccination date rejected by circuit constraints!');
  }

  // 2. Vitals Range Test
  {
    console.log('\n-> Testing vitals_range proof...');
    const wasmPath = path.resolve(__dirname, '../build/vitals_range/vitals_range_js/vitals_range.wasm');
    const zkeyPath = path.resolve(__dirname, '../build/vitals_range/vitals_range_final.zkey');
    const vkey = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../build/vitals_range/verification_key.json'), 'utf8'));

    // Normal Blood Pressure: low = 90, high = 120, actual value = 115 -> valid
    const validInputs = {
      low: 90,
      high: 120,
      value: 115,
      record_hash: 987654321,
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(validInputs, wasmPath, zkeyPath);
    const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    assert.strictEqual(verified, true, 'Valid vitals proof must verify successfully');
    console.log('   ✓ Valid vitals range proof verified successfully!');

    // Invalid test: value = 150 (hypertensive crisis -> outside range)
    const invalidInputs = {
      low: 90,
      high: 120,
      value: 150,
      record_hash: 987654321,
    };

    let failed = false;
    try {
      await snarkjs.groth16.fullProve(invalidInputs, wasmPath, zkeyPath);
    } catch (err) {
      failed = true;
    }
    assert.strictEqual(failed, true, 'Out of range vital must fail constraint check');
    console.log('   ✓ Out of range vital rejected by circuit constraints!');
  }

  // 3. Age Threshold Test
  {
    console.log('\n-> Testing age_threshold proof...');
    const wasmPath = path.resolve(__dirname, '../build/age_threshold/age_threshold_js/age_threshold.wasm');
    const zkeyPath = path.resolve(__dirname, '../build/age_threshold/age_threshold_final.zkey');
    const vkey = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../build/age_threshold/verification_key.json'), 'utf8'));

    // Age in days: today = 20000, dob = 10000 (age = 10000 days), min_age = 6570 (18 years) -> valid
    const validInputs = {
      today_ts: 20000,
      min_age_days: 6570,
      dob_ts: 10000,
      record_hash: 555555555,
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(validInputs, wasmPath, zkeyPath);
    const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    assert.strictEqual(verified, true, 'Valid age proof must verify successfully');
    console.log('   ✓ Valid age threshold proof verified successfully!');

    // Underage test: dob = 19000 (age = 1000 days < 6570 days)
    const invalidInputs = {
      today_ts: 20000,
      min_age_days: 6570,
      dob_ts: 19000,
      record_hash: 555555555,
    };

    let failed = false;
    try {
      await snarkjs.groth16.fullProve(invalidInputs, wasmPath, zkeyPath);
    } catch (err) {
      failed = true;
    }
    assert.strictEqual(failed, true, 'Underage date must fail constraint check');
    console.log('   ✓ Underage date rejected by circuit constraints!');
  }

  console.log('\n🎉 ALL 3 CIRCUITS PASSED FULL PROVING & VERIFICATION SUITE!');
  process.exit(0);
}

testCircuits().catch((err) => {
  console.error(err);
  process.exit(1);
});
