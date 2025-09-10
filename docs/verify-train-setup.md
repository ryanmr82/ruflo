# Verification-Training System Setup

## Overview
The verification-training system integrates verification feedback with neural network training to improve agent performance over time.

## Initial Setup

### 1. Initialize Verification Memory
If you encounter the error `ENOENT: no such file or directory, open '.swarm/verification-memory.json'`, the verification memory needs to be initialized:

```bash
# Create the verification memory file
cat > .swarm/verification-memory.json << 'EOF'
{
  "verificationData": [],
  "trainingHistory": [],
  "agentPerformance": {},
  "modelMetrics": {
    "accuracy": 0,
    "totalPredictions": 0,
    "successfulPredictions": 0
  },
  "lastUpdated": "2025-09-10T18:15:00.000Z",
  "version": "1.0.0"
}
EOF
```

## Available Commands

### Feed Verification Data
```bash
./claude-flow verify-train feed
```
Feeds verification history to the training system. Initially shows "No verification history to feed" until data accumulates.

### Predict Verification Outcome
```bash
./claude-flow verify-train predict <pattern> <agent>
```
Example:
```bash
./claude-flow verify-train predict default coder
```

Output:
- **Predicted Score**: Likelihood of verification success (0-1)
- **Confidence**: Model confidence in prediction
- **Recommendation**: Suggested action (e.g., "add_additional_checks")
- **Historical Success Rate**: Based on past performance
- **Data Points**: Training data size

### Get Agent Recommendation
```bash
./claude-flow verify-train recommend
```
Recommends the best agent for the current task based on reliability scores.

Output:
- **Recommended Agent**: Best performing agent
- **Reliability Score**: Success rate percentage
- **Alternatives**: Other available agents with their scores

### Check System Status
```bash
./claude-flow verify-train status
```
Shows comprehensive verification-training metrics:
- Model version and update timestamp
- Training data statistics
- Agent reliability scores
- Improvement recommendations

### Trigger Neural Training
```bash
./claude-flow verify-train train
```
Manually triggers neural network training with accumulated data.

## How It Works

1. **Data Collection**: System collects verification results from code reviews and tests
2. **Pattern Recognition**: Neural network identifies success/failure patterns
3. **Agent Performance**: Tracks individual agent reliability scores
4. **Continuous Learning**: Model improves with each verification cycle
5. **Smart Recommendations**: Suggests best agents based on task patterns

## Agent Reliability Metrics

Current agent performance (as of latest training):
- **coder**: 81.5% reliability (recommended)
- **reviewer**: 56.6% reliability (needs retraining)

## Best Practices

1. **Regular Feeding**: Run `verify-train feed` after significant code changes
2. **Monitor Reliability**: Check agent scores with `verify-train status`
3. **Act on Recommendations**: Use `verify-train recommend` for agent selection
4. **Retrain Low Performers**: Focus training on agents below 70% reliability

## Troubleshooting

### Missing Verification Memory
If `.swarm/verification-memory.json` is missing, create it using the initialization script above.

### Low Prediction Confidence
If confidence is below 60%, consider:
- Accumulating more training data
- Running `verify-train train` to update the model
- Checking data quality with `verify-train status`

### Agent Performance Issues
For agents with < 70% reliability:
- Review recent verification failures
- Add targeted training data
- Consider agent-specific retraining

## Integration with Claude Flow

The verify-train system integrates with:
- **SPARC Methodology**: Verification at each development phase
- **Swarm Coordination**: Agent selection based on reliability
- **Neural Networks**: Continuous learning from outcomes
- **Memory System**: Persistent performance tracking

## Example Workflow

```bash
# 1. Initialize if needed
./claude-flow verify-train status

# 2. Get agent recommendation
./claude-flow verify-train recommend

# 3. Run task with recommended agent
npx claude-flow@alpha sparc run code "Implement feature"

# 4. Feed results back
./claude-flow verify-train feed

# 5. Check improved metrics
./claude-flow verify-train status
```

---

**Note**: The verification-training system improves over time. Initial predictions may have lower confidence until sufficient training data accumulates.