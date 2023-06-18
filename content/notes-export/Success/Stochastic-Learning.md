---
title: Stochastic Learning
date created: Tuesday, June 13th 2023, 3:31:57 am
date modified: Tuesday, June 13th 2023, 11:42:45 pm
---

# Stochastic Learning

In Machine Learning, Gradient descent is **an optimisation algorithm which is commonly-used to train machine learning models and neural networks**. Training data helps these models learn over time, and the cost function within gradient descent specifically acts as a barometer, gauging its accuracy with each iteration of parameter updates.

## Definitions

### What is a Gradient?

A gradient measures how much the output of a function changes if you change the inputs a little bit.

### What is Cost and Cost Function?

Error in the model. We want to reduce the error to a minimum. Error represent the difference between actual vs outcomes predicted by the ML model. Cost function is function of current parameters to cost value.

### What Are Parameters?

We change the parameters of the function to minimise the cost function

![Gradient-Descent](assets/Gradient-Descent.png)

We try to reduce cost and reach a minima in the cost function.

### What is Learning Rate?

The algorithm designer can set the learning rate. If we use a learning rate that is too small, it will cause us to update very slowly, requiring more iterations to get a better solution.

## Types of Gradient Descent

![stochastic-variations_comparison](assets/stochastic-variations_comparison.png)

### 1. Batch Gradient Descent

Batch gradient descent, also known as vanilla gradient descent, calculates the error for each example within the training dataset. Still, the model is not changed until every training sample has been assessed. The entire procedure is referred to as a cycle and a training epoch.

**Advantages**

1. Fewer model updates mean that this variant is computationally efficient than the stochastic gradient descent method.
2. Reducing the update frequency provides a stable error gradient and convergence.

**Disadvantages**

1. A more stable error gradient can cause the model to prematurely converge to a suboptimal set of parameters. Reaching a local minima.
2. Updates require accumulating prediction errors across all training examples.
3. The batch gradient descent method typically requires the entire training dataset in memory and is implemented for use in the algorithm.
4. Large datasets can result in very slow model updates or training speeds.
5. Slow and require more computational power. Even though it is efficient, it actually does more operations which in turn take more time.

**Real Life Lessons**

1. Checking for all possible alternatives to choose the best path is alluring. But this in fact takes more time and not the most time efficient. We must make a trade off of if we want to work less or spend less time. Eg - A vehicle is most efficient when it runs on economy speeds. We use economy speeds if we want save petrol and speed up if we want to save time.
2. It is very difficult to change the strategy.
3. We might arrive at a better position and think of it as the best as we are not randomly trying other strategies
   Eg. I started running. Started with 2 Kms a day. Running websites suggested to not go for a 10 kms run in 2-3 weeks. But i did and actually found it was easier to me.

### 2. Stochastic Gradient Descent

By contrast, stochastic gradient descent (SGD) changes the parameters for each training sample one at a time for each training example in the dataset. Depending on the issue, this can make SGD faster than batch gradient descent. One benefit is that the regular updates give us a fairly accurate idea of the rate of improvement.

**Advantages**

1. You can instantly see your model’s performance and improvement rates with frequent updates.
3. Increasing the frequency of model updates will allow you to learn more about some issues faster.
4. The noisy update process allows the model to avoid local minima (e.g., premature convergence).

**Disadvantages**

1. Frequent updates can result in noisy gradient signals. This can result in model parameters and cause errors to fly around with more variance
2. A noisy learning process along the error gradient can also make it difficult for the algorithm to commit to the model’s minimum error.

**Real Life Lessons**

1. Frequently changing our minds based on immediate results is foolish. Stick with a regimen or strategy for a week and then check the outcomes.
2. If we change strategy daily, it would lead to noisy outcomes.

### 3. Mini-batch Gradient Descent

Since mini-batch gradient descent combines the ideas of batch gradient descent with SGD, it is the preferred technique. It divides the training dataset into manageable groups and updates each separately. This strikes a balance between batch gradient descent’s effectiveness and stochastic gradient descent’s durability.

**Advantages**

1. The model is updated more frequently than the gradient descent method, allowing for more robust convergence and avoiding local minima.
2. Batch updates provide a more computationally efficient process than stochastic gradient descent.
3. Batch processing allows for both the efficiency of not having all the training data in memory and implementing the algorithm.

**Real Life Lessons**

This is the best of both worlds. Fixating on a strategy vs changing every day.
We pick a strategy for some time. A mini time period. We do not give up because a diet did not work in the first week. We stick with the diet for a week. We change the diet only if we do not see results in a month.
